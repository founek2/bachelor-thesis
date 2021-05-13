#include "Device.h"
#include "Node.h"
#include "NodeMy.h"

const char *Status::init = "init";
const char *Status::ready = "ready";
const char *Status::lost = "lost";
const char *Status::paired = "paired";
const char *Status::sleeping = "sleeping";
const char *Status::restarting = "restarting";
const char *Status::disconnected = "disconnected";

Device::Device(const char *name, PubSubClient *cl) : Base("ESP-1111", name), client(cl)
{
    snprintf(this->id + 4, 9, "%X", ESP.getChipId());
    Serial.printf("DeviceID %s\n", this->id);
    this->_updateTopic();
};

Node *Device::NewNode(const char *nodeId, const char *name, NodeType type)
{
    NodeMy *node = new NodeMy(nodeId, name, type, this->client);
    this->_nodes.add(node);
    return node;
}

void Device::announce()
{
    this->client->publish((this->getTopic() + "/" + "$name").c_str(), this->getName());
    this->client->publish((this->getTopic() + "/" + "$realm").c_str(), this->realm.c_str());

    String nodesList = "";
    for (int i = 0; i < this->_nodes.size(); i++)
    {
        auto node = this->_nodes.get(i);
        nodesList += node->getId();
        if (i < this->_nodes.size() - 1)
            nodesList += ",";
    }
    Serial.print("nodeList");
    Serial.println(nodesList);
    if (this->_nodes.size() > 0)
        this->client->publish((this->getTopic() + "/" + "$nodes").c_str(), nodesList.c_str());

    for (int i = 0; i < this->_nodes.size(); i++)
    {
        auto node = this->_nodes.get(i);
        node->announce();
    }
}

void Device::setRealm(const char *realm)
{
    this->realm = realm;
}
void Device::setPrefix(const char *prefix)
{
    this->prefix = prefix;
    this->_updateTopic();
}

void Device::_updateTopic()
{
    this->setTopic(this->prefix + "/" + this->getId());

    for (int i = 0; i < this->_nodes.size(); i++)
    {
        Node *node = this->_nodes.get(i);
        node->setTopic(this->getTopic() + "/" + node->getId());
    }
}

void Device::publishStatus(const char *status)
{
    Serial.printf("publish status=%s\n", status);
    client->publish((this->getTopic() + "/" + "$state").c_str(), status);
}

void Device::subscribe()
{
    for (int i = 0; i < this->_nodes.size(); i++)
    {
        auto node = this->_nodes.get(i);
        node->subscribe();
    }
}

void Device::handleSubscribe(const String &topic, byte *payload, unsigned int len)
{
    char data[len + 1];
    memcpy(data, payload, len);
    data[len] = '\0';
    for (int i = 0; i < this->_nodes.size(); i++)
    {
        auto node = this->_nodes.get(i);
        if (topic.startsWith(this->getTopic()))
            node->handleSubscribe(topic, data);
    }
}

const char *Device::getId()
{
    return this->id;
}