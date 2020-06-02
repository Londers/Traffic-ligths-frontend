import React, {Component} from 'react';
// import logo from './logo.svg';
import './App.css';
import './static/css/chat_interface.css';
import './static/css/temporary.css';

class SendButton extends Component {
    render() {
        return (<div className="send_message" onClick={this.props.handleClick}>
            <div className="text">send</div>
        </div>);
    }
}

class MessageTextBoxContainer extends Component {
    render() {
        return (
            <div className="message_input_wrapper">
                <input id="msg_input" className="message_input" placeholder="Type your messages here..."
                       value={this.props.message} onChange={this.props.onChange}
                       onKeyPress={this.props._handleKeyPress}/>
            </div>
        );
    }
}

class Avatar extends Component {
    render() {
        return (
            <div className="avatar" style={{textAlign: "center"}}>
                <h5 style={{verticalAlign: "center"}}>{this.props.nickname.substr(0, 2)}</h5>
            </div>
        );
    }
}

// class BotMessageBox extends Component {
//     constructor(props) {
//         super(props);
//     }
//
//     render() {
//         return (
//             <li className="message left appeared">
//                 <Avatar></Avatar>
//                 <div className="text_wrapper">
//                     <div className="text">{this.props.message}</div>
//                 </div>
//             </li>
//         );
//     }
// }

class MessageTop extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                {/*<h5 style={{float: this.props.appearance, display: this.props.display}}>%USERNAME%</h5>*/}
                <h5 style={{float: this.props.appearance}}>{this.props.nickname}</h5>
                <h5 style={{
                    float: this.props.appearance,
                    marginRight: 150,
                    marginLeft: 150
                }}>{this.props.time}</h5>
            </div>
        );
    }
}

class UserMessageBox extends Component {
    constructor(props) {
        super(props);

    }

    render() {
        return (
            <div>
                <MessageTop appearance={this.props.appearance}
                            nickname={this.props.nickname}
                            time={this.props.time}/>
                {/*// display = {(this.props.last_message === "%USERNAME%") ? "none" : "block"}/>*/}
                <li className={`message ${this.props.appearance} appeared`}>
                    <Avatar nickname={this.props.nickname}/>
                    <div className="text_wrapper">
                        <div className="text">{this.props.message}</div>
                    </div>
                </li>
            </div>
        );
    }
}

class MessagesContainer extends Component {
    constructor(props) {
        super(props);
        this.createBotMessages = this.createBotMessages.bind(this);
    }

    scrollToBottom() {
        let el = this.refs.scroll;
        el.scrollTop = el.scrollHeight;
    };

    componentDidMount() {
        this.scrollToBottom();
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }

    createBotMessages() {
        // console.log(this.props.messages);
        return this.props.messages.map((message, index) =>
            <UserMessageBox key={index} message={message["message"]}
                            time={message["time"]} nickname={message["nickname"]}
                            appearance={message["userMessage"] ? "right" : "left"}/>
        );
    }

    render() {
        return (
            <ul className="messages" ref="scroll">
                {this.createBotMessages()}
            </ul>
        );
    }
}

class UserList extends Component {
    constructor(props) {
        super(props);
        this.createUsers = this.createUsers.bind(this);
        this.myRef = React.createRef();
    }

    componentDidMount() {
        this.props.onRef(this)
    }

    createUsers() {
        console.log("createUsers");
        // console.log(this.props.users);
        if (this.props.users === undefined) {
            // this.createUsers();
            return;
        }
        // this.props.users.map((user, index) => {
        //     console.log(user);
        // });
        return this.props.users.map((user, index) =>
            <li key={index}>
                <div>
                    <h5 className={"offline"}>
                        {user.user}
                        {/*<i className="fa fa-circle offline"/> {user}*/}
                    </h5>
                </div>
            </li>
        );
    }

    changeStatus(index, status) {
        let elem = this.myRef.current;
        if (elem === undefined) return;

        if (this.props.users.length <= index) {
            return false;
        }
        // console.log(index + "---" + status);
        // console.log(this.props.users);
        // console.log(elem.children.length);
        console.log("changeStatus");
        // console.log(elem);
        let child = elem.children[index].innerHTML;
        if (child.includes("offline")) {
            elem.children[index].innerHTML = child.replace("offline", status);
        } else {
            elem.children[index].innerHTML = child.replace("online", status);
        }
        // console.log(child);
        return true;
    }

    render() {
        return (
            <ul className="users" ref={this.myRef}>
                {this.createUsers()}
            </ul>
        )
    }
}

class ChatApp extends Component {
    constructor(props) {
        super(props);
        this.state = {
            "messages": [],
            "users": [location.pathname.split('/')[2]],
            "user_message": "",
            "received_message": ""
        };//[location.pathname.split('/')[2]], "user_message": "", "received_message": ""};
        this.handleClick = this.handleClick.bind(this);
        this._handleKeyPress = this._handleKeyPress.bind(this);
        this.onChange = this.onChange.bind(this);
        this.addMessageBox = this.addMessageBox.bind(this);
        this.componentDidMount = this.componentDidMount.bind(this);
        // eslint-disable-next-line no-restricted-globals
        this.user = true;
    }

    componentDidMount() {
        let shit = this;
        shit.ws = new WebSocket('ws://' + location.host + '/user/' + location.pathname.split('/')[2] + '/chatW');
        shit.ws.onopen = function () {
            // on connecting, do nothing but log it to the console
            console.log('connected')
        };

        shit.ws.onmessage = function (evt) {console.log(evt.data);
            // listen to data sent from the websocket server
            const dataType = JSON.parse(evt.data);
            const data = JSON.parse(dataType.data);
            console.log('received ' + data.type);
            console.log(data);
            switch (dataType.type) {
                case "message":
                    // eslint-disable-next-line no-restricted-globals
                    shit.user = (data.from === location.pathname.split('/')[2]);
                    (shit.user) ? (shit.state.user_message = data.message) : (shit.state.received_message = data.message);
                    let date = new Date(data.time.substr(0, data.time.length - 1));
                    date = new Date(date.getTime() - (date.getTimezoneOffset() * 60 * 1000));
                    const dateTimeFormat = new Intl.DateTimeFormat('ru', { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit"});
                    // console.log(date);
                    let fd = dateTimeFormat.format(date);
                    // console.log(data);
                    // console.log('received ' + data.message + ' ' +  new Date(data.time.substr(0, data.time.length - 1)));

                    shit.addMessageBox(fd, data.from);//(data.from === undefined) ? location.pathname.split('/')[2] : data.from);
                    break;
                case "archive":
                    if(data.messages === null) return;
                    data.messages.forEach(msg => {
                        // console.log("VIU2");
                        // console.log(msg);
                        shit.user = (msg.from === location.pathname.split('/')[2]);
                        (shit.user) ? (shit.state.user_message = msg.message) : (shit.state.received_message = msg.message);
                        // console.log(shit.user);
                        let date = new Date(msg.time);
                        const dateTimeFormat = new Intl.DateTimeFormat('ru', { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit"});
                        let fd = dateTimeFormat.format(date);
                        // console.log(data);
                        // console.log('received ' + msg.message);
                        // console.log("COMPLETE user="+msg.from+", msg="+msg.message);

                        shit.addMessageBox(fd, msg.from);//(msg.from === undefined) ? location.pathname.split('/')[2] : msg.from);
                    });
                    break;
                case "users":
                    shit.state.users = data.users;
                    shit.child.props.users = data.users;
                    console.log("users");
                    // console.log(data);
                    // console.log(shit.state.users);
                    shit.child.createUsers();
                    shit._handleKeyPress({key:'neEnter'});
                    data.users.map((user) => {
                        if (user.status === "online") shit.child.changeStatus(shit.findUser(user.user), "online");
                    });
                    break;
                case "status":
                    // console.log("status");
                    // console.log(data);
                    // console.log(data.user + " " + data.status);
                    let index = shit.findUser(data.user);
                    shit.child.changeStatus(index, data.status);
                    break;
                case "error":
                    console.log(data.user + " - " + data.error);
                    break;
            }
            // if (message.time === undefined) return;

        };

        shit.ws.onclose = function () {
            console.log('disconnected')
            // automatically try to reconnect on connection loss

        };

    }

    findUser(user) {
        let counter = 0;
        let index = -1;
        this.state.users.map((obj) => {
            if (obj.user === user) {
                index = counter;
            }
            counter++;
        });
        return index;
    }

    addMessageBox(time, nickname, enter = true) {
        // console.log(time + ' ?-? ' + nickname);
        let messages = this.state.messages;
        let message = (this.user) ? this.state.user_message : this.state.received_message;
        if (message && enter) {
            messages = [...messages, {
                "message": message,
                "userMessage": this.user,
                "time": time,
                "nickname": nickname
            }];
            if (this.user) message = "";
        }
        if (this.user) {
            this.setState({
                user_message: message,
                messages
            });
        } else {
            this.setState({
                received_message: message,
                messages
            });
        }

    }

    handleClick() {
        if (this.state.user_message === "") return;
        let now = new Date();
        // now = new Date(now.getTime() - (now.getTimezoneOffset() * 60 * 1000));
        let json = {
            type: "message",
            // eslint-disable-next-line no-restricted-globals
            from: location.pathname.split('/')[2],
            to: 'Global',
            message: this.state.user_message,
            time: now.toISOString()
        };
        this.ws.send(JSON.stringify(json));
        // this.addMessageBox();
    }

    onChange(e) {
        this.setState({
            user_message: e.target.value
        });
    }

    _handleKeyPress(e) {
        if ((e.key === "Enter") && (this.state.user_message !== "")) {
            let now = new Date();
            // now = new Date(now.getTime() - (now.getTimezoneOffset() * 60 * 1000));
            let json = {
                type: "message",
                // eslint-disable-next-line no-restricted-globals
                from: location.pathname.split('/')[2],
                to: 'Global',
                message: this.state.user_message,
                time: now.toISOString()
            };
            this.ws.send(JSON.stringify(json));
        } else {
            this.addMessageBox(undefined, undefined, false)
        }
    }

    render() {
        return (
            <div className="row">

                <div className="chat_window">
                    <MessagesContainer messages={this.state.messages}/>
                    <div className="bottom_wrapper clearfix">
                        <MessageTextBoxContainer
                            _handleKeyPress={this._handleKeyPress}
                            onChange={this.onChange}
                            message={this.state.user_message}/>
                        <SendButton handleClick={this.handleClick}/>
                    </div>
                </div>
                <div className="user_list">
                    <div>
                        <UserList
                            users={this.state.users}
                            onRef={ref => (this.child = ref)}/>
                    </div>
                </div>
            </div>
        );
    }
}

export default ChatApp;