import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Grid from '@material-ui/core/Grid';
import DialogTitle from '@material-ui/core/DialogTitle';
import Typography from '@material-ui/core/Typography';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import Loader from 'framework-ui/lib/Components/Loader';
import { login, fetchAuthType } from 'framework-ui/lib/redux/actions/application/user';
import FieldConnector from 'framework-ui/lib/Components/FieldConnector';
import { getFieldVal, getUserPresence } from 'framework-ui/lib/utils/getters';
import { AuthTypes } from 'common/lib/constants';
import * as deviceActions from '../../store/actions/application/devices';
import { grey } from '@material-ui/core/colors';
import { forgotPassword } from 'frontend/src/store/actions/application/user';

const styles = (theme) => ({
    loginTitle: {
        margin: '0 auto',
        paddingBottom: 20,
        [theme.breakpoints.down('sm')]: {
            paddingBottom: 0,
        },
    },
    loginActions: {
        margin: 'auto',
        justifyContent: 'center',
    },
    content: {
        position: 'relative',
        width: 400,
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),
        overflowY: 'visible',

        [theme.breakpoints.down('sm')]: {
            width: '100%',
            marginLeft: 0,
            marginRight: 0,
        },
    },
    loginFooter: {
        marginTop: 10,
        textAlign: 'center',
        paddingBottom: theme.spacing(2),
        overflowY: 'visible',
    },
    registerButton: {
        cursor: 'pointer',
        color: grey[500],
    },
});

let timer = null;
function onStopTyping(callback) {
    return (e) => {
        clearTimeout(timer);
        timer = setTimeout(callback, 800);
    };
}

function LoginDialog({ open, onClose, classes, loginAction, authType, fetchAuthTypeAction, onSuccess }) {
    const [pending, setPending] = useState(false);

    async function fetchAuthType() {
        if (pending) return;
        clearTimeout(timer);
        setPending(true);
        await fetchAuthTypeAction();
        setPending(false);
    }
    const loginMyAction = async () => {
        setPending(true);
        const success = await loginAction();
        setPending(false);
        if (success) onSuccess && onSuccess();
    };

    const actionHandler = (!authType && fetchAuthType) || loginMyAction;

    return (
        <Dialog open={open} onClose={onClose} aria-labelledby="form-dialog-title" maxWidth="xs" fullWidth>
            <DialogTitle id="form-dialog-title" className={classes.loginTitle}>
                Přihlášení
            </DialogTitle>
            <DialogContent className={classes.content}>
                <Grid container justify="center" spacing={2}>
                    <Grid item md={10} xs={12}>
                        <FieldConnector
                            deepPath="LOGIN.userName"
                            autoFocus
                            onEnter={actionHandler}
                            onChange={onStopTyping(fetchAuthType)}
                            fieldProps={{
                                autoComplete: 'off',
                                fullWidth: true,
                            }}
                        />
                    </Grid>
                    {authType === AuthTypes.PASSWD && (
                        <Grid item md={10} xs={12}>
                            <FieldConnector
                                deepPath="LOGIN.password"
                                component="PasswordField"
                                autoFocus
                                fieldProps={{
                                    fullWidth: true,
                                }}
                                onEnter={actionHandler}
                            />
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions className={classes.loginActions}>
                <Button color="primary" onClick={actionHandler} disabled={pending}>
                    {!authType ? 'Další' : 'Přihlásit'}
                </Button>
                <Loader open={pending} />
            </DialogActions>
            <DialogContent className={classes.loginFooter}>
                <Typography component="div">
                    {/* Nemáte účet?{' '} */}
                    <Link to={{ hash: 'forgot' }}>
                        <Typography display="inline" className={classes.registerButton}>
                            Zapomenuté heslo?
                        </Typography>
                    </Link>
                </Typography>
            </DialogContent>
        </Dialog>
    );
}

const _mapStateToProps = (state) => ({
    authType: getFieldVal('LOGIN.authType')(state),
    userPresence: getUserPresence(state),
});

const _mapDispatchToProps = (dispatch) =>
    bindActionCreators(
        {
            loginAction: login,
            fetchAuthTypeAction: fetchAuthType,
            // fetchDevicesAction: deviceActions.fetch,
        },
        dispatch
    );

export default connect(_mapStateToProps, _mapDispatchToProps)(withStyles(styles)(LoginDialog));
