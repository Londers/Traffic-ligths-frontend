import React, {Component} from 'react';
// import logo from './logo.svg';
import './App.css';
import './static/css/chat_interface.css';
import './static/css/temporary.css';
import 'font-awesome/css/font-awesome.min.css';

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
                    marginRight: 50,
                    marginLeft: 50
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
        console.log(this.props.messages);
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

    createUsers(users) {
        console.log("create user");
        if(users === undefined) return;
        this.users = users;
        users.map((user, index) => console.log(user + "---" + index))
        return users.map((user, index) =>
            <li key={index}>
                <div>
                    <h5>
                        <i className="fa fa-circle offline"/> {user}
                    </h5>
                </div>
            </li>
        );
    }

    changeStatus(index, status) {
        let elem = this.myRef.current;
        console.log("elem");
        console.log(elem);
        console.log("index:"+index + " status:"+status);
        if(elem.children[index] === undefined) return;
        let child = elem.children[index].innerHTML;
        if (child.includes("offline")) {
            elem.children[index].innerHTML = child.replace("offline", status);
        } else {
            elem.children[index].innerHTML = child.replace("online", status);
        }
        console.log(child);
        // return undefined;
    }

    render() {
        return (
            <ul className="users" ref={this.myRef}>
                {this.createUsers(this.users)}
            </ul>
        )
    }
}

class ChatApp extends Component {
    constructor(props) {
        super(props);
        this.state = {"messages": [], "users": [], "user_message": "", "received_message": ""};
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
        shit.ws = new WebSocket('wss://192.168.115.120:8082/user/' + location.pathname.split('/')[2] + '/chatW');
        shit.ws.onopen = function () {
            // on connecting, do nothing but log it to the console
            console.log('connected')
        };

        shit.ws.onmessage = function (evt) {
            // listen to data sent from the websocket server
            const data = JSON.parse(evt.data);
            switch (data.type) {
                case "message":
                    shit.state.received_message = data.message;
                    // eslint-disable-next-line no-restricted-globals
                    shit.user = (data.from === location.pathname.split('/')[2]);
                    let date = new Date(data.time.substr(0, data.time.length - 1));
                    date = new Date(date.getTime() + (date.getTimezoneOffset() * 60 * 1000));
                    const dateTimeFormat = new Intl.DateTimeFormat('ru', {month: 'short', day: '2-digit'});
                    const [{value: month}, , {value: day}] = dateTimeFormat.formatToParts(date);
                    // console.log('received ' + message.message);

                    shit.addMessageBox((`${month} ${day}, ` + date.getHours() + ':' + date.getMinutes()), (data.from === undefined) ? location.pathname.split('/')[2] : data.from);
                    break;
                case "users":
                    console.log(data);
                    shit.state.users = data.users;
                    shit.child.createUsers(data.users);
                    console.log(data);
                    break;
                case "status":
                    console.log(data);
                    shit.child.changeStatus(shit.state.users.indexOf(data.user), data.status);
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

    addMessageBox(time, nickname, enter = true) {
        console.log(time + ' ?-? ' + nickname);
        let messages = this.state.messages;
        let message = (this.user) ? this.state.user_message : this.state.received_message;
        console.log(this.state);
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
        if (e.key === "Enter") {
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
            <div className="chat_window">
                <MessagesContainer messages={this.state.messages}/>
                <div className="bottom_wrapper clearfix">
                    <MessageTextBoxContainer
                        _handleKeyPress={this._handleKeyPress}
                        onChange={this.onChange}
                        message={this.state.user_message}/>
                    <SendButton handleClick={this.handleClick}/>
                </div>
                <div className="user_list">
                    <div>
                        <UserList
                            // users={this.state.users.users}
                            onRef={ref => (this.child = ref)} />
                    </div>
                </div>
            </div>
        );
    }
}

export default ChatApp;