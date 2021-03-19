import React, {useEffect} from 'react';
import {useStyles} from './use-styles';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Typography, Accordion, AccordionSummary, AccordionDetails, Link} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {getReportList} from "../../../redux/selectors/medical-reports-page/reports";
import {getFullName} from "../../../redux/selectors/user/current-user";
import {obtainReports} from "../../../redux/actions/medical-reports-page/reports";

const MedicalReportsPatientView = ({reportList, userName, obtainReports}) => {
    const classes = useStyles();

    useEffect(() => {
        obtainReports();
    });

    return (
        <div>
            {
                reportList.length > 0 ?
                    reportList.map(report => {
                        if (userName === report.patientName) {
                            return (
                                <Accordion>
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon/>}
                                    >
                                        <Typography
                                            className={classes.accordionHeading}
                                        >
                                            {report.reportName}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography variant="h5">
                                            Report Date: {report.reportDate} &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                                            &nbsp; &nbsp; &nbsp; &nbsp; Patient Name: {report.patientName}
                                            <br/>
                                            <br/>
                                            Doctor Name: {report.doctorName} &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                                            &nbsp; &nbsp; &nbsp; &nbsp;
                                            <Link onClick={() => window.open(report.reportFileUrl)}>
                                                View Report
                                            </Link>
                                        </Typography>
                                    </AccordionDetails>
                                </Accordion>
                            )
                        } else {
                            return null;
                        }
                    })
                    :
                    <Accordion>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon/>}
                        >
                            <Typography
                                className={classes.accordionHeading}
                            >
                                You do not currently have any medical reports.
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                Your doctor or administrator will add one when necessary.
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
            }
        </div>
    )
};

MedicalReportsPatientView.propTypes = {
    reportList: PropTypes.array,
    userName: PropTypes.string.isRequired,
    obtainReports: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    reportList: getReportList(state),
    userName: getFullName(state)
});

const mapDispatchToProps = dispatch => ({
    obtainReports: () => dispatch(obtainReports())
});

export default connect(mapStateToProps, mapDispatchToProps)(MedicalReportsPatientView);