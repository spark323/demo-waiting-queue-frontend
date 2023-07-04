import React, { Component } from 'react'
import axios from 'axios';
export default class Main extends Component {
    constructor(props) {
        super(props)
        this.state = {
            url: "",
            status: "waiting",
            waitingNum: 0,
            receipt_handle: "",
            messageGroupId: "",
            view_time: 0,
            email: "",
        }
    }
    componentDidMount = async () => {
        this.connectToWebScoket();
    }
    closeWebSocket = () => {
        if (this.timerPing) {
            clearInterval(this.timer);
            this.timerPing = null;
        }
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
    }
    onValueChanged = (name, value) => {

        const { data } = this.state;

        this.setState(
            { ...this.state, [name]: value }
        )

    }
    connectToWebScoket = () => {
        const address = `wss://${process.env.REACT_APP_SOCKET_API_GATEWAY_ID}.execute-api.ap-northeast-2.amazonaws.com/prod-${process.env.REACT_APP_BACKEND_VERSION}`
        if (this.websocket == undefined) {
            this.websocket = new WebSocket(address);


            this.websocket.onopen = (message) => {
                this.websocket.send(JSON.stringify({ message: 'request_update' }))
                console.log(message)
                this.timerPing = setInterval(() => {

                    if (this.websocket) {
                        this.websocket.send(JSON.stringify({ message: 'ping' }));
                    }
                }, 60 * 1000);
            };
            this.websocket.onmessage = (message) => {
                let obj = JSON.parse(message.data);
                this.onMessageReceived(obj);
            };
            this.websocket.onclose = (event) => {
                console.log('onclose');
                if (this.timerPing || this.websocket) this.closeWebSocket();
            };
            this.websocket.onerror = (event) => {
                console.error('WebSocket error observed:', event);
                if (this.timerPing || this.websocket) this.closeWebSocket();
            };
        }
    }

    //웹소켓으로 메세지를 받았을 때. 메세지 종류(stauts)는 3가지. Start: 예약시작, Update:대기열 및 정보 업데이트, End:예약 종료
    onMessageReceived = async (message) => {
        console.log(message)
        const that = this;
        if (message.status == "start") {
            this.setState({
                status: message.status,
                url: message.url,
                receipt_handle: message.receipt_handle,
                messageGroupId: message.messageGroupId,
                view_time: message.view_time

            })
            this.timer = setInterval(() => {
                that.setState({
                    view_time: Math.max(that.state.view_time - 1000, 0)
                })
            }, 1000);
        }
        else if (message.status == "update") {
            this.setState({
                messageGroupId: message.messageGroupId ? message.messageGroupId : this.state.messageGroupId,
                waitingNum: message.waitingNum,
                waitingTime: message.waitingTime,
                concurrency: message.concurrency,
            })
        }
        else if (message.status == "end") {
            this.closeWebSocket();
            this.setState({
                status: message.status,

            })
        }

    }
    onSubmit = async (message) => {

        const result = await axios({
            method: 'DELETE',
            url: `https://${process.env.REACT_APP_API_GATEWAY_ID}.execute-api.ap-northeast-2.amazonaws.com/prod/sqs`,
            params: {
                receipt_handle: this.state.receipt_handle,
                email: this.state.email
            }
        });;
        this.closeWebSocket();
        this.setState({
            status: "end"
        })
    }
    render() {
        return (
            <div>
                <h3>이메일 등록</h3>
                <div className="mb-12" style={{ textAlign: 'center' }}>
                    <label>MessageGroupId:{this.state.messageGroupId}</label>
                    {
                        (this.state.status == "start" && this.state.url != "") && (
                            <div>
                                <img src={this.state.url}></img>
                                <label>남은시간:{parseInt(this.state.view_time / 1000)} 초</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="이메일을 입력하세요"
                                    value={this.state.email}
                                    onChange={(val) => {
                                        this.onValueChanged("email", val.target.value);
                                    }}
                                />
                                <div className="d-grid" style={{ marginTop: 15 }}>
                                    <button type="submit" className="btn btn-primary" onClick={this.onSubmit}>
                                        등록
                                    </button>
                                </div>
                            </div>
                        )
                    }
                    {
                        (this.state.status == "end") && <div>등록되었습니다.</div>
                    }
                    {
                        (this.state.status == "waiting") && <div>{`대기중입니다. ${this.state.waitingNum == 0 ? "" : "대기열:" + this.state.waitingNum},예상 대기시간:
                        ${this.state.waitingNum == 0 ? "" : parseInt((this.state.waitingNum / this.state.concurrency) * this.state.waitingTime / 1000)}초`}</div>
                    }

                </div>

            </div>
        )
    }
}
