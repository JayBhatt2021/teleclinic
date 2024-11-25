import React, {useEffect, useState} from 'react';
import './messages-page.css';
import PropTypes from "prop-types";
import {connect} from "react-redux";
import SidebarUser from "../../components/messages/sidebar-user";
import {getUserId, getUserType} from "../../redux/selectors/user/current-user";
import {getRealTimeConversations, getRealTimeUsers} from "../../redux/selectors/messages-page/messages";
import {PATIENT_TYPE} from "../../utils/constantList";
import {
    obtainRealTimeConversations,
    obtainRealTimeUsers,
    updateMessage
} from "../../redux/actions/messages-page/messages";

const MessagesPage = ({
                          userId,
                          userType,
                          realTimeUsers,
                          realTimeConversations,
                          obtainRealTimeUsers,
                          obtainRealTimeConversations,
                          updateMessage
                      }) => {
    const [chatStarted, setChatStarted] = useState(false);
    const [chatUser, setChatUser] = useState('');
    const [message, setMessage] = useState('');
    const [userUid, setUserUid] = useState(null);

    useEffect(() => {
        if (userId) {
            obtainRealTimeUsers(userId)
        }
    });

    const initChat = (user) => {
        setChatStarted(true)
        setChatUser(user.fullName)
        setUserUid(user.uid);
        obtainRealTimeConversations(user.uid);
    };

    const submitMessage = e => {
        const msgObj = {
            uid_1: userId,
            uid_2: userUid,
            message
        }

        if (message !== "") {
            updateMessage(msgObj)
                .then(() => {
                    setMessage('')
                });
        }
    };

    return (
        <section className="container">
            <div className="listOfUsers">
                {
                    realTimeUsers.length > 0 ?
                        realTimeUsers.map(user => {
                            if (userType === PATIENT_TYPE) {
                                if (user.userType === PATIENT_TYPE) {
                                    return null;
                                }
                                else {
                                    return (
                                        <SidebarUser
                                            onClick={initChat}
                                            key={user.uid}
                                            user={user}
                                        />
                                    );
                                }
                            }
                            else {
                                return (
                                    <SidebarUser
                                        onClick={initChat}
                                        key={user.uid}
                                        user={user}
                                    />
                                );
                            }
                        }) : null
                }
            </div>
            <div className="chatArea">
                <div className="chatHeader">
                    {
                        chatStarted ? chatUser : ''
                    }
                </div>
                <div className="messageSections">
                    {
                        chatStarted ?
                            realTimeConversations.map(con =>
                                <div style={{textAlign: con.uid_1 === userId ? 'right' : 'left'}}>
                                    {
                                        con.uid_1 === userId ? <p className="sentMessageStyle">{con.message}</p> :
                                            <p className="receivedMessageStyle">{con.message}</p>
                                    }
                                </div>)
                            : null
                    }
                </div>
                {
                    chatStarted ?
                        <div className="chatControls">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Enter message here."
                            />
                            <button onClick={submitMessage}>Send</button>
                        </div> : null
                }
            </div>
        </section>
    );
};

MessagesPage.propTypes = {
    userId: PropTypes.string.isRequired,
    userType: PropTypes.string.isRequired,
    realTimeUsers: PropTypes.array.isRequired,
    realTimeConversations: PropTypes.array.isRequired,
    obtainRealTimeUsers: PropTypes.func.isRequired,
    updateMessage: PropTypes.func.isRequired,
    obtainRealTimeConversations: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    userId: getUserId(state),
    userType: getUserType(state),
    realTimeUsers: getRealTimeUsers(state),
    realTimeConversations: getRealTimeConversations(state)
});

const mapDispatchToProps = dispatch => ({
    obtainRealTimeUsers: userId => dispatch(obtainRealTimeUsers(userId)),
    updateMessage: messageObject => dispatch(updateMessage(messageObject)),
    obtainRealTimeConversations: receiverUserId => dispatch(obtainRealTimeConversations(receiverUserId))
});

export default connect(mapStateToProps, mapDispatchToProps)(MessagesPage);
