import keymirror from 'key-mirror';

export const actionTypes = keymirror({
    REGISTER_FIELD: null,
    UNREGISTER_FIELD: null,
    UPDATE_REGISTERED_FIELD: null,
    UPDATE_FORM_STATE: null,
    SET_FIELD_DESCRIPTORS: null,
    SET_FORMS_DATA: null,
    UPDATE_FORM: null,
    UPDATE_FORM_FIELD: null,
    UPDATE_REGISTERED_FIELDS: null,
    ADD_NOTIFICATION: null,
    REMOVE_NOTIFICATION: null,
    SET_USER: null,
    UPDATE_USER: null,
    ADD_USER: null,
    REMOVE_USER: null,
    SET_USERS: null,
    REMOVE_USERS: null,
    SET_FORM_DATA: null,
    UPDATE_USERS: null,
    RESET_TO_DEFAULT: null,
    DEHYDRATE_STATE: null,
    HYDRATE_STATE: null,
    UPDATE_HISTORY: null,
    SET_HISTORY: null,
    UPDATE_TMP_DATA: null,
    SET_TMP_DATA: null,
    REMOVE_FORM: null
});

export const STATE_DEHYDRATED = 'STATE_DEHYDRATED';

export const POSITION_UPDATE_INTERVAL = 1000 * 60 * 5; // 5min
