import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar, SnackbarKey } from 'notistack';
import { removeNotification } from 'framework-ui/lib/redux/actions/application/notifications';

interface notification {
    key: SnackbarKey
    message: string
    options: any
    dismissed: boolean
    variant?: "default" | "error" | "success" | "warning" | "info" | undefined
    onClose: any,
    duration?: number
}
let displayed: SnackbarKey[] = [];

const Notifier = () => {
    const dispatch = useDispatch();
    const notifications = useSelector<any, notification[]>(store => store.application.notifications || []);

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const storeDisplayed = (id: SnackbarKey) => {
        displayed = [...displayed, id];
    };

    const removeDisplayed = (id: SnackbarKey) => {
        displayed = [...displayed.filter(key => id !== key)];
    };

    React.useEffect(() => {
        notifications.forEach(({ key, message, variant, dismissed = false, onClose, duration = 3000 }) => {
            if (dismissed) {
                // dismiss snackbar using notistack
                closeSnackbar(key);
                return;
            }

            // do nothing if snackbar is already displayed
            if (displayed.includes(key)) return;

            // display snackbar using notistack
            enqueueSnackbar(message, {
                key,
                variant,
                autoHideDuration: duration,
                onClose: (event, reason, myKey) => {
                    if (onClose) {
                        onClose(event, reason, myKey);
                    }
                },
                onExited: (event, myKey) => {
                    // remove this snackbar from redux store
                    dispatch(removeNotification(myKey));
                    removeDisplayed(myKey);
                },
            });

            // keep track of snackbars that we've displayed
            storeDisplayed(key);
        });
    }, [notifications, closeSnackbar, enqueueSnackbar, dispatch]);

    return null;
};

export default Notifier;
