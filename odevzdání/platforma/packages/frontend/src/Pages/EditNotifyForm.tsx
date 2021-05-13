import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import AddCircle from '@material-ui/icons/AddCircle';
import { IDevice } from 'common/lib/models/interface/device';
import { IThing } from 'common/lib/models/interface/thing';
import Loader from 'framework-ui/lib/Components/Loader';
import * as formsActions from 'framework-ui/lib/redux/actions/formsData';
import { getFormData } from 'framework-ui/lib/utils/getters';
import { clone } from 'ramda';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { getToken } from '../firebase';
import * as deviceActions from '../store/actions/application/devices';
import * as userActions from '../store/actions/application/user';
import { IState } from '../types';
import { getDevices } from '../utils/getters';
import EditNotify from './editNotifyForm/EditNotify';
import { NOTIFY_INTERVALS } from 'common/lib/constants';

const defaultAdvanced = {
    interval: NOTIFY_INTERVALS.JUST_ONCE,
    from: '00:00',
    to: '23:59',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
};

const useStyles = makeStyles((theme) => ({
    card: {
        overflow: 'auto',
        margin: '0px auto',
        position: 'relative',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: 650,
        marginTop: 0,

        [theme.breakpoints.down('sm')]: {
            width: '100%',
            //height: '100%'
        },
        [theme.breakpoints.down('xs')]: {
            width: '100%',
        },
        [theme.breakpoints.up('lg')]: {
            //height: 410
        },
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
            flexDirection: 'column',
        },
    },
    header: {
        paddingBottom: 0,
        paddingTop: theme.spacing(4),
        textAlign: 'center',
    },
    content: {
        paddingLeft: theme.spacing(6),
        paddingRight: theme.spacing(6),
        [theme.breakpoints.down('sm')]: {
            flexDirection: 'column',
            textAlign: 'center',
            paddingLeft: theme.spacing(1),
            paddingRight: theme.spacing(1),
        },
    },
}));

const FIELDS = ['propertyId', 'type', 'value', 'interval'];
const FIELDS_ADVANCED = ['interval', 'from', 'to', 'daysOfWeek'];

interface EditDeviceDialogProps {
    updateFormField: any;
    fillEditFormAction: any;
    editForm: any;
    sensorCount?: number;
    preFillForm: any;
    onUpdate: any;
    registerTokenAction: any;
    match: { params: { deviceId: IDevice['_id']; nodeId: IThing['config']['nodeId'] } };
    device?: IDevice;
    thing?: IThing;
    onSaveAction: any;
}

function EditDeviceDialog({
    updateFormField,
    fillEditFormAction,
    editForm,
    sensorCount = 0,
    onUpdate,
    registerTokenAction,
    match: { params },
    preFillForm,
    device,
    onSaveAction,
    thing,
}: EditDeviceDialogProps) {
    const [pending, setPending] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const classes = useStyles();

    useEffect(() => {
        async function preFill() {
            setPending(true);
            const success = await preFillForm(params.deviceId, params.nodeId);
            if (success) setLoaded(true);
            setPending(false);
        }

        async function sendToken() {
            const token = await getToken();
            console.log('getting token: ', token);
            registerTokenAction(token);
        }
        preFill();
        sendToken();
    }, []);

    function removeSensorByIndex(idx: number) {
        const newEditForm = clone(editForm);
        for (let i = idx + 1; i < sensorCount; i++) {
            FIELDS.forEach((key) => {
                if (newEditForm[key]) newEditForm[key][i - 1] = editForm[key][i];
            });
        }
        FIELDS.forEach((key) => {
            if (newEditForm[key] && idx < newEditForm[key].length) newEditForm[key].pop();
        });

        if (newEditForm.advanced) {
            for (let i = idx + 1; i < sensorCount; i++) {
                FIELDS_ADVANCED.forEach((key) => {
                    if (newEditForm.advanced[key]) newEditForm.advanced[key][i - 1] = editForm[key][i];
                });
            }
            FIELDS_ADVANCED.forEach((key) => {
                if (newEditForm.advanced[key] && idx < newEditForm.advanced[key].length)
                    newEditForm.advanced[key].pop();
            });
        }

        newEditForm.count = sensorCount - 1;
        fillEditFormAction(newEditForm);
    }

    function handleAdd() {
        updateFormField('EDIT_NOTIFY.count', sensorCount + 1);
        updateFormField('EDIT_NOTIFY.advanced.interval.' + sensorCount, defaultAdvanced.interval);
        updateFormField('EDIT_NOTIFY.advanced.from.' + sensorCount, defaultAdvanced.from);
        updateFormField('EDIT_NOTIFY.advanced.to.' + sensorCount, defaultAdvanced.to);
        updateFormField('EDIT_NOTIFY.advanced.daysOfWeek.' + sensorCount, defaultAdvanced.daysOfWeek);
    }

    const handleSave = async () => {
        setPending(true);
        await onSaveAction(params.deviceId, params.nodeId);
        setPending(false);
    };

    return loaded && thing?.config ? (
        <Card className={classes.card}>
            <CardHeader className={classes.header} titleTypographyProps={{ variant: 'h3' }} />
            <CardContent className={classes.content}>
                <div>
                    {/* <Typography variant="subtitle1" align="center" >Notifikace:</Typography> */}
                    {sensorCount > 0 &&
                        [...Array(sensorCount).keys()].map((i) => (
                            <EditNotify id={i} key={i} onDelete={removeSensorByIndex} config={thing.config} />
                        ))}
                </div>
                <IconButton aria-label="Add a sensor" onClick={handleAdd}>
                    <AddCircle />
                </IconButton>
            </CardContent>
            <CardActions className={classes.actions}>
                <Button color="primary" variant="contained" onClick={handleSave} disabled={pending}>
                    Uložit
                </Button>
                <Loader open={pending} />
            </CardActions>
        </Card>
    ) : pending ? (
        <Loader open={pending} />
    ) : (
        <Typography>Nelze načíst data</Typography>
    );
}

const _mapStateToProps = (state: IState, { match: { params } }: EditDeviceDialogProps) => {
    const editForm: any = getFormData('EDIT_NOTIFY')(state);
    const sensorCount = editForm ? editForm.count : undefined;
    const device = (getDevices(state) as IDevice[]).find((obj) => obj._id === params.deviceId);
    const thing = device?.things.find((thing) => thing.config.nodeId === params.nodeId);
    return {
        sensorCount,
        editForm,
        device,
        thing,
    };
};

const _mapDispatchToProps = (dispatch: any) => ({
    ...bindActionCreators(
        {
            updateFormField: formsActions.updateFormField,
            fillEditFormAction: formsActions.fillForm('EDIT_NOTIFY'),
            preFillForm: deviceActions.prefillNotify,
            onSaveAction: deviceActions.updateNotify,
            registerTokenAction: userActions.registerToken,
        },
        dispatch
    ),
});

export default connect(_mapStateToProps, _mapDispatchToProps)(EditDeviceDialog);
