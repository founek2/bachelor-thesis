import React from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'

function InfoAlert({onClose, open, content, title, closeText="Potvrdit"}) {
     return (
          
               <Dialog
                    open={open}
                    onClose={onClose}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
               >
                    <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
                    <DialogContent>
                         <DialogContentText id="alert-dialog-description">
                              {content}
                         </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                         <Button onClick={onClose} color="primary" autoFocus>
                              {closeText}
                         </Button>
                    </DialogActions>
               </Dialog>
     )
}

export default InfoAlert
