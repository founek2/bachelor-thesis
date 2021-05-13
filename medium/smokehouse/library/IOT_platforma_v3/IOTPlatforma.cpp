#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include <ESP8266WiFi.h>
#include <EEPROM.h>
#include <IOTPlatforma.h>
#include <WiFiClientSecureBearSSL.h>
#include <WiFiManager.h>
#include <ESP8266HTTPClient.h>

// const char fingerprint[] = "7C:77:E9:A0:BB:42:C5:1D:09:1B:E4:BF:7F:9E:32:A7:54:AD:4C:19"; // localhost
// const char fingerprint[] = "90:72:F4:F6:D6:4D:EA:76:6C:B7:14:B3:DD:CE:CC:DD:8E:F7:4E:E7"; // v2.iot
const char fingerprint[] = "62:5B:96:DF:D5:BE:4B:7C:44:FE:DF:68:AF:8D:8D:8D:6C:A6:DA:E6"; // test.iot

WiFiManager wifiManager;
const char *menu[] = {"wifi"};
bool IOTPlatforma::captivePortal(const char *SSID)
{
    // this->mem.clearEEPROM();
    // wifiManager.erase();
    WiFi.mode(WIFI_STA);

    wifiManager.setMenu(menu, 1);
    wifiManager.setConfigPortalTimeout(300);
    wifiManager.setShowInfoUpdate(false);
    WiFiManagerParameter custom_username("username", "Uživ. jméno", "", realmMaxLen - 1);
    wifiManager.addParameter(&custom_username);

    WiFiManagerParameter custom_mqtt_server("server", "Platforma URL", "dev.iotplatforma.cloud", serverMaxLen - 1);
    wifiManager.addParameter(&custom_mqtt_server);

    bool shouldSaveParams = false;
    wifiManager.setSaveParamsCallback([&shouldSaveParams]() {
        Serial.println("setSaveParamsCallonback");
        shouldSaveParams = true;
    });

    bool statusOk = false;
    while (statusOk == false)
    {
        bool isConnected = wifiManager.autoConnect(SSID);
        if (!isConnected)
            continue;

        Serial.print("shouldSaveParams");
        Serial.println(shouldSaveParams);

        if (shouldSaveParams)
        {
            this->wifiClient.setInsecure();

            if (this->_userExists(custom_username.getValue(), custom_mqtt_server.getValue()))
            {
                this->mem.setServerAndRealm(custom_mqtt_server.getValue(), custom_username.getValue());
                this->_device.setRealm(this->mem.getRealm());
            }

            this->wifiClient.setFingerprint(fingerprint);
        }
        else
        {
            this->mem.loadEEPROM();
            this->_device.setRealm(this->mem.getRealm());
        }

        if (this->mem.getPairStatus() != PAIR_STATUS_BLANK)
        {
            statusOk = true;
        }
        else
            wifiManager.erase();
    }

    // this->mem.setServerAndRealm("dev.iotplatforma.cloud", "martas");
    // this->_device.setRealm(this->mem.getRealm());
    return wifiManager.getWiFiIsSaved();
}

IOTPlatforma::IOTPlatforma(const char *deviceName) : wifiClient(), client(wifiClient), _device(deviceName, &this->client)
{

    wifiClient.setFingerprint(fingerprint);
    // wifiClient.setInsecure();
}

void IOTPlatforma::start()
{
    this->captivePortal();

    client.setServer(this->mem.getServer(), 8884);
    client.setBufferSize(350);

    this->loop();
}

bool IOTPlatforma::_connect()
{
    if (this->mem.getPairStatus() == PAIR_STATUS_INIT)
    {
        return this->_connectDiscovery();
    }
    else if (this->mem.getPairStatus() == PAIR_STATUS_PAIRED)
    {
        return this->_connectPaired();
    }
    else
        Serial.println("Error> pairStatus should be at least PAIR_STATUS_INIT");

    return false;
}

bool IOTPlatforma::_connectWith(const char *userName, const char *password, int counter)
{
    Serial.printf("_connectWith ID=%s, userName=%s, password=%s, server=%s\n", this->_device.getId(), userName, password, this->mem.getServer());

    randomSeed(micros());
    while (!client.connected() && counter > 0)
    {
        Serial.printf("FreeHeap %d\n", ESP.getFreeHeap());

        Serial.print("Attempting MQTT connection...");
        // Create a random client ID
        String clientId = String(this->_device.getId()) + "-" + this->mem.getRealm();

        --counter;
        if (client.connect(clientId.c_str(), userName, password, (this->_device.getTopic() + "/" + "$state").c_str(), 1, false, Status::lost))
        {
            Serial.println("connected");
            client.setCallback([this](const char *topic, byte *payload, unsigned int length) {
                this->_handleSubscribe(topic, payload, length);
            });
            return true;
        }
        else
        {
            Serial.print("failed, rc=");
            Serial.print(client.state());
            Serial.println(" try again in 5 seconds");
            // Wait 5 seconds before retrying
            delay(5000);
        }
    }
    return false;
}

bool IOTPlatforma::_connectDiscovery()
{
    Serial.println("Connecting discovery");

    this->_device.setPrefix("prefix");
    bool connected = this->_connectWith((std::string("guest=") + this->_device.getId()).c_str(), "guest");
    if (connected)
    {
        this->client.subscribe((this->_device.getTopic() + "/$config/apiKey/set").c_str());
        this->client.subscribe((this->_device.getTopic() + "/$cmd/set").c_str());
        this->_device.publishStatus(Status::init);
        this->_device.announce();
        this->_device.publishStatus(Status::ready);
    }
    return connected;
}

bool IOTPlatforma::_connectPaired()
{
    Serial.println("Connecting paired");

    this->_device.setPrefix((String("v2/") + this->mem.getRealm()).c_str());
    bool connected = this->_connectWith((String("device=") + this->mem.getRealm() + "/" + this->_device.getId()).c_str(), this->mem.getApiKey());
    if (connected)
    {
        this->client.subscribe((this->_device.getTopic() + "/$cmd/set").c_str());
        this->_device.publishStatus(Status::ready);
        this->_device.subscribe();
    }

    return connected;
}

void IOTPlatforma::loop()
{
    client.loop();

    if (!client.connected())
    {
        // TODO limit reconnecting - now blocking a lot of time, maybe lower counter for connect / time window between reconnection (ex. 1min)
        Serial.println("Client disconnected, reconnecting.");
        this->_connect();
    }

    if (this->ota.enabled)
        this->ota.handleOTA();
}

boolean IOTPlatforma::connected(void)
{
    return client.connected();
}

void IOTPlatforma::_handleSubscribe(const char *top, byte *payload, unsigned int len)
{
    String topic = top;
    payload[len] = '\0'; // possible error
    Serial.print("topic ");
    Serial.println(topic.c_str());
    Serial.print("payload ");
    Serial.println((char *)payload);

    String apiTopic = this->_device.getTopic() + "/$config/apiKey/set";
    String cmdTopic = this->_device.getTopic() + "/$cmd/set";

    Serial.printf("handle %s vs %s\n", this->_device.getTopic().c_str(), topic.c_str());
    if (apiTopic == topic)
    {
        char data[len + 1];
        memcpy(data, payload, len);
        data[len] = '\0';

        this->mem.setApiKey(data);
        this->_device.publishStatus(Status::paired);
        this->disconnect();
        this->_connectPaired();
    }
    else if (cmdTopic == topic)
    {
        if (String((const char *)payload) == "restart")
        {
            this->_device.publishStatus(Status::restarting);
            client.disconnect();
            ESP.restart();
        }
        else if (String((const char *)payload) == "reset")
        {
            this->disconnect();
            this->reset();
            ESP.restart();
        }
    }
    else if (topic.startsWith(this->_device.getTopic()))
    {
        this->_device.handleSubscribe(topic, payload, len);
    }
}

void IOTPlatforma::enableOTA(const char *password, const uint16_t port, const char *hostname)
{
    this->ota.enableOTA(password, port, hostname);
}

Node *IOTPlatforma::NewNode(const char *nodeId, const char *name, NodeType type)
{
    return this->_device.NewNode(nodeId, name, type);
}

void IOTPlatforma::disconnect()
{
    this->_device.publishStatus(Status::disconnected);
    this->client.disconnect();
}

void IOTPlatforma::sleep()
{
    this->_device.publishStatus(Status::sleeping);
    this->client.disconnect();
}

void IOTPlatforma::reset()
{
    wifiManager.erase();
    this->mem.clearEEPROM();
}

bool IOTPlatforma::publish(const char *topic, const char *message)
{
    return this->client.publish(topic, message);
}

bool IOTPlatforma::_userExists(const char *userName, const char *server)
{
    HTTPClient http;
    this->wifiClient.setInsecure();
    String url = String("https://") + server + "/api/user/" + userName + "?attribute=authType";
    http.begin(this->wifiClient, url.c_str());
    int result = http.GET();
    Serial.printf("user exists %d\n", result);
    Serial.printf("url %s\n", url.c_str());

    this->wifiClient.setFingerprint(fingerprint);
    return result == 200;
}