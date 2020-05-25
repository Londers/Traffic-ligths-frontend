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
            <div className="avatar"/>
        );
    }
}

class BotMessageBox extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <li className="message left appeared">
                <Avatar></Avatar>
                <div className="text_wrapper">
                    <div className="text">{this.props.message}</div>
                </div>
            </li>
        );
    }
}

class UserMessageBox extends Component {
    constructor(props) {
        super(props);

    }

    render() {
        return (
            <li className={`message ${this.props.appearance} appeared`}>
                <Avatar></Avatar>
                <div className="text_wrapper">
                    <div className="text">{this.props.message}</div>
                </div>
            </li>
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


class ChatApp extends Component {
    constructor(props) {
        super(props);
        this.state = {"messages": [], "user_message": "", "received_message" : ""};
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
            const message = JSON.parse(evt.data);
            shit.state.received_message = message.message;
            // eslint-disable-next-line no-restricted-globals
            shit.user =  (message.from === location.pathname.split('/')[2]);

            // this.setState({dataFromServer: message});
            console.log('received ' + message.message);
            shit.addMessageBox();
        };

        shit.ws.onclose = function () {
            console.log('disconnected')
            // automatically try to reconnect on connection loss

        };

    }

    addMessageBox(enter = true) {
        let messages = this.state.messages;
        let message = (this.user) ? this.state.user_message : this.state.received_message;
        console.log(this.state);
        if (message && enter) {
            messages = [...messages, {"message": message, "userMessage": this.user}];
            if(this.user) message =  "";
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
        let enter_pressed = false;
        if (e.key === "Enter") {
            enter_pressed = true;
        }
        this.addMessageBox(enter_pressed)
    }

    render() {
        return (
            <div className="chat_window">
                <MessagesContainer messages={this.state.messages}></MessagesContainer>
                <div className="bottom_wrapper clearfix">
                    <MessageTextBoxContainer
                        _handleKeyPress={this._handleKeyPress}
                        onChange={this.onChange}
                        message={this.state.user_message}></MessageTextBoxContainer>
                    <SendButton handleClick={this.handleClick}></SendButton>
                </div>

            </div>
        );
    }
}

export default ChatApp;