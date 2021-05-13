import React, { useState, Fragment } from 'react'
import FieldConnector from 'framework-ui/lib/Components/FieldConnector'
import FormLabel from '@material-ui/core/FormLabel'
import { withStyles } from '@material-ui/core/styles'
import ClearIcon from '@material-ui/icons/Clear'
import IconButton from '@material-ui/core/IconButton'
import MenuItem from '@material-ui/core/MenuItem'
import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import { connect } from 'react-redux'

import { getFieldVal } from 'framework-ui/lib/utils/getters'
import DaysOfWeekPicker from './DaysOfWeekPicker'
import { NotifyIntervals } from 'common/lib/constants'
import ControlPart from './editNotify/ControlPart'
import SensorsPart from './editNotify/SensorsPart'

const styles = theme => ({
    quantity: {
        marginTop: 30,
        position: "relative"
    },
    clearButton: {
        position: "absolute",
        right: 10,
        top: -15,
    },
    advanced: {
        textAlign: "center",
        fontSize: 12,
        cursor: "pointer",
        marginTop: 8,
        userSelect: "none",
    },
    daysPicker: {
        maxWidth: 350,
        // display: "flex",
        margin: "0 auto"
    },
})

function EditSensor({ id, classes, onDelete, recipe = [], editedAdvanced, formName, JSONkey }) {
    const [openAdvanced, setOpen] = useState(false)
    const sensorMode = formName === "EDIT_NOTIFY_SENSORS"
    const props = { JSONkey, id, recipe }

    return (<Grid container key={id} spacing={2} className={classes.quantity}>
        <Grid item md={12}>
            <FormLabel component="legend">Notifikace {id}:</FormLabel>
            <IconButton className={classes.clearButton} aria-label="Delete a sensor" onClick={e => onDelete(id, e)}>
                <ClearIcon />
            </IconButton>
        </Grid>

        {sensorMode ? <SensorsPart {...props} /> : <ControlPart {...props} />}
        <Grid item md={12} xs={12}>
            <FieldConnector
                fieldProps={{
                    type: 'text',
                    multiline: true,
                    fullWidth: true
                }}
                deepPath={`${formName}.description.${id}`}
            />
        </Grid>
        <Grid item md={12} xs={12}>
            <Typography
                className={classes.advanced}
                color="primary"
                onClick={() => setOpen(!openAdvanced)}
            >Rozšířené {editedAdvanced && "⭣"}
            </Typography>
        </Grid>
        {openAdvanced && <Fragment>
            {/* <div className={classes.contentInner}> */}
            <Grid item md={4} xs={12}>
                <FieldConnector
                    component="Select"
                    deepPath={`${formName}.advanced.interval.${id}`}
                    selectOptions={
                        NotifyIntervals.map(
                            ({ value, label }) =>
                                <MenuItem value={value} key={value}>
                                    {label}
                                </MenuItem>
                        )}
                    fieldProps={{
                        fullWidth: true
                    }}
                />
            </Grid>
            <Grid item md={2} xs={6}>
                <FieldConnector
                    deepPath={`${formName}.advanced.from.${id}`}
                    fieldProps={{
                        // defaultValue: "00:00",
                        fullWidth: true,
                        type: "time"
                    }}
                />
            </Grid>
            <Grid item md={2} xs={6}>
                <FieldConnector
                    deepPath={`${formName}.advanced.to.${id}`}
                    fieldProps={{
                        // defaultValue: "23:59",
                        fullWidth: true,
                        type: "time"
                    }}
                />
            </Grid>
            {/* </div> */}
            <Grid item md={12} xs={12}>
                <div className={classes.daysPicker}>
                    <FieldConnector
                        deepPath={`${formName}.advanced.daysOfWeek.${id}`}
                        component={DaysOfWeekPicker}
                    />
                </div>
            </Grid>
        </Fragment>

        }
    </Grid>)
}

const _mapStateToProps = (state, { id, formName }) => {
    const days = getFieldVal(`${formName}.advanced.daysOfWeek.${id}`, state)
    const editedAdvanced = getFieldVal(`${formName}.advanced.to.${id}`, state) ||
        getFieldVal(`${formName}.advanced.from.${id}`, state) ||
        (days && days.length < 7)

    return {
        editedAdvanced: !!editedAdvanced,
    }
}

export default connect(_mapStateToProps)(withStyles(styles)(EditSensor));