import React, { useState } from 'react'
import { withStyles } from '@material-ui/core/styles'
import { connect } from 'react-redux'
import { registerAngLogin, register } from 'framework-ui/lib/redux/actions/application/user'
import { bindActionCreators } from 'redux'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import Button from '@material-ui/core/Button'
import Loader from 'framework-ui/lib/Components/Loader'
import { getFormData } from 'framework-ui/lib/utils/getters'
import { o, prop } from 'ramda'
import { AuthTypes } from 'common/lib/constants'
import Checkbox from '@material-ui/core/Checkbox'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import UserForm from '../components/UserForm'
import userActions from '../store/actions/application/user'
import { create as createCredentials } from '../utils/webAuth'
import { getAuthChallenge as getAuthChallengeApi } from '../api/authApi'

const styles = theme => ({
    card: {
        overflow: 'auto',
        margin: '0px auto',
        position: 'relative',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: 470,
        marginTop: 0,

        [theme.breakpoints.down('sm')]: {
            width: '100%',
            //height: '100%'
        },
        [theme.breakpoints.down('xs')]: {
            width: '100%'
        },
        [theme.breakpoints.up('lg')]: {
            //height: 410
        }
    },
    actions: {
        marginBottom: theme.spacing(2),
        [theme.breakpoints.up('sm')]: {
            marginTop: theme.spacing(2),
        },
        margin: 'auto',
        width: 400,
        justifyContent: 'center',

        [theme.breakpoints.down('sm')]: {
            width: '100%',
            justifyContent: 'flex-start',
            flexDirection: 'column'
        }
    },
    header: {
        paddingBottom: 0,
        paddingTop: theme.spacing(4),
        textAlign: 'center'
    },
    content: {
        paddingLeft: 30,
        paddingRight: 30,
    }
})

export const AuthTypesWithText = [{ value: AuthTypes.WEB_AUTH, text: 'web API' }]

function RegisterUser({ classes, registerAndLoginAction, authType, registerAction, getChallengeAction, history }) {
    const [pending, setPending] = useState(false)
    const [autoLogin, setAutoLogin] = useState(true)
    const handleRegister = async () => {
        setPending(true)
        const action = autoLogin ? registerAndLoginAction : registerAction
        await action().then(success => {
            if (autoLogin && success) history.push("/")
        })
        setPending(false)
    }

    const handleAuth = async (e) => {
        if (e.target.value !== "webAuth") return;
        setPending(true)
        try {
            const challenge = await getChallengeAction()
            const credentials = await createCredentials(challenge);
            console.log("credentials", credentials)
        } catch{
            // TODO change to empty auth
        }
        setPending(false)
    }
    return (
        <Card className={classes.card}>
            <CardHeader className={classes.header} title="Registrace" />
            <CardContent className={classes.content}>
                <UserForm formName="REGISTRATION" onAuthChange={handleAuth} />
            </CardContent>
            <CardActions className={classes.actions}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={autoLogin}
                            onChange={e => setAutoLogin(e.target.checked)}
                            value="checkedB"
                            color="default"
                        />
                    }
                    label="Po registraci přihlásit"
                />
                <Button
                    color="primary"
                    variant="contained"
                    className={classes.button}
                    onClick={handleRegister}
                    disabled={pending}
                >
                    Registrovat
                    </Button>
                <Loader open={pending} />
            </CardActions>
        </Card>
    )
}

const _mapStateToProps = state => ({
    authType: o(prop('authType'), getFormData('REGISTRATION'))(state),
    kekel: 'ble'
})

const _mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            registerAndLoginAction: registerAngLogin,
            registerAction: register,
            getChallengeAction: userActions.getAuthChallenge,
        },
        dispatch
    )

export default connect(
    _mapStateToProps,
    _mapDispatchToProps
)(withStyles(styles)(RegisterUser))
