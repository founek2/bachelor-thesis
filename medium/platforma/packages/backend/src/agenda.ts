import Agenda from "agenda";
import config from "common/lib/config";
import createMongoUri from "common/lib/utils/createMongoUri";
import logger from "framework-ui/lib/logger";
import { AGENDA_JOB_TYPE } from "common/lib/constants/agenda";

const configDb = config.db;
const configAgenda = config.agenda;

const connectionOpts = {
    db: {
        address: createMongoUri(configDb),
        collection: configAgenda.collection,
        options: {
            useUnifiedTopology: true,
        },
    },
};

const agenda = new Agenda(connectionOpts);

const jobTypes = configAgenda.jobs ? configAgenda.jobs.split(",") : [];
logger.debug("loading jobs:", jobTypes);

jobTypes.forEach(async (type: string) => {
    const job = require("./jobs/" + type) as { default: (agenda: Agenda) => void };
    job.default(agenda);
});

agenda.processEvery("one minute");

agenda.on("start", (job) => {
    logger.debug("Job", job.attrs.name, "starting");
});
if (jobTypes.length) {
    (async () => {
        await agenda.start();

        agenda.every("24 hours", AGENDA_JOB_TYPE.REMOVE_OLD_JOBS);
    })();
}

export default agenda;
