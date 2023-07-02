import React, { Component, Fragment } from 'react';

import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom"




import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import Main from './components/pages/Main'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }
  componentDidMount() { }

  render() {
    return (
      <Fragment>
        <Router>
          <div className="App">
            <nav className="navbar navbar-expand-lg navbar-light fixed-top">
              <div className="container">
                <Link className="navbar-brand" to={'/sign-in'}>
                  Demo - 대기열
                </Link>

              </div>
            </nav>
            <div className="auth-wrapper">
              <div className="auth-inner">
                <Routes>
                  <Route exact path="/" element={<Main />} />

                </Routes>
              </div>
            </div>
          </div>
        </Router>
      </Fragment>
    );
  }
}

export default App;
