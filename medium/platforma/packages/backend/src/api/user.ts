import { AuthTypes } from 'common/lib/constants';
import fieldDescriptors from 'common/lib/fieldDescriptors';
import { IUser } from 'common/lib/models/interface/userInterface';
import { TokenModel } from 'common/lib/models/tokenModel';
import { UserModel } from 'common/lib/models/userModel';
import { UserService } from 'common/lib/services/userService';
import { getAllowedGroups } from 'framework-ui/lib/privileges';
import formDataChecker from '../middlewares/formDataChecker';
import { rateLimiterMiddleware } from '../middlewares/rateLimiter';
import resource from '../middlewares/resource-router-middleware';
import tokenAuthMIddleware from '../middlewares/tokenAuth';
import checkWritePerm from '../middlewares/user/checkWritePerm';
import eventEmitter from '../services/eventEmitter';

function removeUserItself(id: IUser['_id']) {
    return function (doc: IUser) {
        return doc._id != id; // dont change to !==
    };
}

/**
 * URL prefix /user
 */
export default () =>
    resource({
        middlewares: {
            index: [tokenAuthMIddleware()],
            create: [
                rateLimiterMiddleware,
                formDataChecker(fieldDescriptors, {
                    allowedForms: ['LOGIN', 'REGISTRATION', 'FORGOT', 'FORGOT_PASSWORD'],
                }),
            ],
            replaceId: [
                tokenAuthMIddleware(),
                checkWritePerm(),
                formDataChecker(fieldDescriptors, { allowedForms: ['EDIT_USER', 'FIREBASE_ADD'] }),
            ],
            deleteId: [tokenAuthMIddleware(), checkWritePerm()],
        },
        /** GET / - List all users in system
         * @restriction regular user - list only userNames, admin - list all users
         * @header Authorization-JWT
         * @param type optional, specify property of user, supported: userName
         * @return json
         *              - type == userName { data: { _id: string, userName: string }[] }
         *              - default { users: IUser[] }
         */
        async index({ user, root, query: { type } }: any, res) {
            if (user && type === 'userName') {
                // tested
                console.log('retrieving userNames');
                const docs = await UserModel.findAllUserNames();
                res.send({ data: docs.map(({ _id, info: { userName } }) => ({ _id, userName })) });
            } else if (root) {
                const docs = await UserModel.findAll();
                res.send({ docs: docs.filter(removeUserItself(user.id)).map((obj) => obj.toObject()) });
            } else if (user && user.admin) {
                // tested
                const docs = await UserModel.findAllNotRoot();
                res.send({ docs: docs.filter(removeUserItself(user.id)).map((obj) => obj.toObject()) });
            } else res.sendStatus(500);
        },

        /** GET /:id - Return an user attribute
         * @param attribute specify an user atribute, supported: authType
         * @return json { authType: AuthTypes }
         */
        async read({ params, query }, res) {
            const { id } = params;
            const { attribute } = query;

            if (attribute === 'authType') {
                const doc = await UserModel.findByUserName(id);

                if (!doc) res.status(404).send({ error: 'unknownUser' });
                else res.send({ authType: doc.auth.type });
            } else {
                res.sendStatus(400);
            }
        },

        /** POST / - Do something based on body content
         * @body form
         * - LOGIN check provided credentials
         * - REGISTRATION register new user
         * - FORGOT send email with link to change password
         * - FORGOT_PASSWORD - change password to user determined by one time use token
         * @return json
         * - LOGIN | REGISTRATION { user: IUser, token: JwtToken }
         */
        async create(req, res) {
            const { formData } = req.body;

            if (formData.LOGIN) {
                const { doc, token, error } = await UserService.checkCreditals(formData.LOGIN);
                if (error) return res.status(401).send({ error });

                res.send({
                    user: doc,
                    token,
                });
                eventEmitter.emit('user_login', doc);
            } else if (formData.REGISTRATION) {
                if (await UserModel.exists({ 'info.userName': formData.REGISTRATION.info.userName }))
                    return res.status(409).send({ error: 'userNameAlreadyExist' });
                const { doc, token } = await UserService.create(formData.REGISTRATION);

                res.send({
                    user: doc,
                    token,
                });
                eventEmitter.emit('user_signup', { id: doc._id, info: doc.info });
            } else if (formData.FORGOT) {
                eventEmitter.emit('user_forgot', { email: formData.FORGOT.email });
                res.sendStatus(204);
            } else if (formData.FORGOT_PASSWORD) {
                console.log('forgot', formData.FORGOT_PASSWORD);
                const token = await TokenModel.retrieve(formData.FORGOT_PASSWORD.token);
                if (!token) return res.sendStatus(400);

                UserService.updateUser(token.userId, {
                    auth: { password: formData.FORGOT_PASSWORD.password, type: AuthTypes.PASSWD },
                });
                res.sendStatus(204);
            } else {
                res.sendStatus(400);
            }
        },

        /** DELETE /:id - Delete provided user
         * @restriction user is admin or is deleting himself
         * @header Authorization-JWT
         */
        async deleteId({ params }, res) {
            await UserService.deleteById(params.id);
            res.sendStatus(204);
        },

        async replaceId({ body, params, user }: any, res) {
            const { id } = params;
            if (body.formData.EDIT_USER) {
                const allowedGroups = getAllowedGroups(user.groups).map((obj) => obj.name);

                if (!body.formData.EDIT_USER.groups.every((group: string) => allowedGroups.includes(group)))
                    return res.sendStatus(403);

                await UserService.updateUser(id, body.formData.EDIT_USER);
                res.sendStatus(204);
            } else if (body.formData.FIREBASE_ADD) {
                await UserModel.addNotifyToken(id, body.formData.FIREBASE_ADD.token);
                res.sendStatus(204);
            } else res.sendStatus(400);
        },
    });
