import React from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import Select from '../../../../core/Select'
import { Button, Form, FormGroup, Col, FormControl, ControlLabel } from 'react-bootstrap'
import { i18n } from 'euler-ui'
import utils from '../../../../core/utils'
import UploadPanel from '../compile/UploadPanel'

var BuildNum = React.createClass({
  componentDidUpdate(prevProps, prevState) {
    this.setBuildOptions();
  },
  componentDidMount() {
    this.setBuildOptions();
  },
  setBuildOptions() {
    var options = this.props.options;
    options = _.map(options, (option) => {
      option.displayText = "[#" + (option.buildNumber || "") + "] [" + (utils.getFormattedTime(option.createdTime) || "") + "] [" + (option.release ? "Release" : "Snapshot") + "]";
      return option;
    })
    this.refs.selector.setOptions(options, options[0]);
  },
  getValue() {
    return this.refs.selector.getValue();
  },
  getBuildNumValue(buildNumObj) {
    return buildNumObj && buildNumObj.commitId;
  },
  render() {
    return (
      <Select ref="selector" getValue={ (this.props.type === "compile") ? this.getBuildNumValue : "" } valueKey="buildNumber" labelKey="displayText" options={ [] } wrapperClassName="componentDeployToolbarBtn__selector"
      />
      );
  }
})

var ProgressButton = React.createClass({
  renderProgress() {
    var progress = this.props.progress;
    if (progress === undefined) {
      return
    }
    return (<div className="progressBtn__progress" style={ { width: progress + "%" } }>
              <div className="progressBtn__progress--running"></div>
            </div>)
  },
  render() {
    var props = this.props;
    var progress = props.progress;
    var displayText = progress !== undefined ? (props.progressText + progress + "%") : props.text;
    var className = props.className || "";
    return (
      <div className={ `progressBtn ${className}` }>
        <Button bsStyle="primary" disabled={ props.disabled } block onClick={ props.onClick }>
          { displayText }
        </Button>
        { this.renderProgress() }
      </div>
      );
  }
})
var CompileBtnGroup = React.createClass({
  contextTypes: {
    code: React.PropTypes.string,
    tenantEnvCode: React.PropTypes.string
  },
  getInitialState() {
    return {
      commitIsSelected: false
    };
  },
  compileComponent(ref, isRelease) {
    var commitVal = this.refs[ref].getValue();
    var props = this.props;
    var model = props.model;
    props.actions.compileComponent({
      componentCode: model.code,
      componentVersion: model.version,
      tenantEnvCode: this.context.tenantEnvCode,
      tenantCode: model.tenantCode,
      commitNumber: commitVal,
      isRelease: isRelease
    });
  },
  afterCommitSelectInit() {
    if (this.refs.commitNum.getValue()) {
      this.setState({
        commitIsSelected: true
      })
    }
  },
  labelRenderer(item) {
    return "[" + (utils.getFormattedTime(item.committedDate) || "") + "] [" + (item.committedUser || "") + "] [" + (item.comment || "") + "]";
  },
  genBuildOptions() {
    return _.filter(this.props.buildHistories, (history) => {
      return history.buildResultCode === 100;
    })
  },
  renderUploadButton() {
    var props = this.props;
    var model = props.model;
    var componentTypeId = model && model.componentType && model.componentType.id;
    if (componentTypeId === 'javaee_app') { // 屏蔽上传功能
      return (
        <div className="product-deploy-componentDeployToolbar-group" style={ { height: 100 } }>
          <UploadPanel componentCode={ model.code } componentVersion={ model.version } />
        </div>
      )
    }
  },
  render() {
    var props = this.props;
    var buildOptions = this.genBuildOptions();
    var buildIsSelected = !!buildOptions.length;

    var data = props.data;
    var inProgress = false;
    var snapshotProgress;
    var releaseProgress;
    if (data && (data.get("status") === 1)) {
      inProgress = true;
      if (data.get("isRelease")) {
        releaseProgress = data.get("progress") || 0;
      } else {
        snapshotProgress = data.get("progress") || 0;
      }
    }
    // console.warn("snapshotProgress", snapshotProgress, "inProgress", inProgress);
    // console.warn("releaseProgress", releaseProgress, "inProgress", inProgress);
    var snapshotProps = {
      progress: snapshotProgress,
      text: i18n.get("product.deploy.compilingSnapshot"),
      progressText: i18n.get("product.deploy.compiling"),
      disabled: !this.state.commitIsSelected || inProgress,
      onClick: this.compileComponent.bind(this, "commitNum", false)
    }
    var releaseProps = {
      progress: releaseProgress,
      text: i18n.get("product.deploy.compilingRelease"),
      progressText: i18n.get("product.deploy.compiling"),
      disabled: !buildIsSelected || inProgress,
      onClick: this.compileComponent.bind(this, "buildNum", true)
    }
    return (
      <Form inline>
        { this.renderUploadButton() }
        <FormGroup className="product-deploy-componentDeployToolbar-group">
          <ControlLabel className="componentDeployToolbarBtn__label">
            Commit
          </ControlLabel>
          <Select ref="commitNum" afterInit={ this.afterCommitSelectInit } restParams={ { productCode: this.context.code } } valueKey="id" labelRenderer={ this.labelRenderer } url="/portal/repositories/products/:productCode/commits"
            wrapperClassName="componentDeployToolbarBtn__selector" />
          <ProgressButton {...snapshotProps} />
        </FormGroup>
        <br/>
        <FormGroup className="product-deploy-componentDeployToolbar-group">
          <ControlLabel className="componentDeployToolbarBtn__label">
            Build
          </ControlLabel>
          <BuildNum type={ props.type } ref="buildNum" options={ buildOptions } />
          <ProgressButton {...releaseProps} />
        </FormGroup>
      </Form>
      );
  }
})

var DeployBtnGroup = React.createClass({
  contextTypes: {
    tenantEnvCode: React.PropTypes.string
  },
  packageComponent() {
    var buildVal = this.refs.buildNum.getValue();
    var props = this.props;
    var model = props.model;
    this.props.actions.packageComponent({
      componentCode: model.code,
      componentVersion: model.version,
      tenantEnvCode: this.context.tenantEnvCode,
      tenantCode: model.tenantCode,
      buildNumber: buildVal
    });
    this.props.activateConsole();
  },
  openSpecModal() {
    var props = this.props;
    var model = props.model;
    this.props.actions.openSpecModal(model, this.context.tenantEnvCode);
  },
  genBuildOptions() {
    return _.filter(this.props.buildHistories, (history) => {
      return history.buildResultCode === 100;
    })
  },
  render() {
    var props = this.props;
    var inProgress = false;
    var packageProgress;
    var deployProgress;
    var buildOptions = this.genBuildOptions();
    var buildIsSelected = !!buildOptions.length;
    var data = props.data;
    if (data && (data.get("status") === 1)) {
      inProgress = true;
      if (data.get("opType") === "package") {
        packageProgress = data.get("progress") || 0;
      }
      if (data.get("opType") === "deploy") {
        deployProgress = data.get("progress") || 0;
      }
    }

    // console.warn("packageProgress", packageProgress, "inProgress", inProgress);
    // console.warn("deployProgress", deployProgress, "inProgress", inProgress);

    var packageProps = {
      progress: packageProgress,
      text: i18n.get("product.deploy.package"),
      progressText: i18n.get("product.deploy.packaging"),
      disabled: !buildIsSelected || inProgress,
      onClick: this.packageComponent
    }
    var deployProps = {
      progress: deployProgress,
      text: i18n.get("product.deploy.name"),
      progressText: i18n.get("product.deploy.deploying"),
      disabled: !buildIsSelected || inProgress,
      onClick: this.openSpecModal
    }
    return (
      <Form inline>
        <FormGroup className="product-deploy-componentDeployToolbar-group">
          <ControlLabel className="componentDeployToolbarBtn__label">
            Build
          </ControlLabel>
          <BuildNum type={ props.type } ref="buildNum" options={ buildOptions } />
          <ProgressButton className="button__package" {...packageProps} />
          <span className="componentDeployToolbarBtn__splitter">|</span>
          <ProgressButton className="button__deploy" {...deployProps} />
        </FormGroup>
      </Form>
      );
  }
})

var DeployToolbar = React.createClass({
  componentDidUpdate(prevProps, prevState) {
    var data = this.props.data;
    if (data && (prevProps.data !== data) && data.get("status")) {
      this.processBuildProgress();
    }
  },
  queryProgressRate(instanceId) {
    var props = this.props;
    var tenantEnvCode = props.tenantEnvCode;
    var buildId = props.actions.queryProgressRate(instanceId, props.model, tenantEnvCode);
  },
  queryBuildLogs(instanceId) {
    var props = this.props;
    var tenantEnvCode = props.tenantEnvCode;
    props.actions.queryBuildLogs(instanceId, props.model, tenantEnvCode, this.props.logIndex || 0);
  },
  queryCompResources() {
    var props = this.props;
    var tenantEnvCode = props.tenantEnvCode;
    props.actions.queryCompResources(props.model, tenantEnvCode);
  },
  queryCompileHistory() {
    var props = this.props;
    var model = props.model;
    props.actions.queryCompileHistory(model.code, model.version, model.tenantCode, props.tenantEnvCode);
  },
  resetBuildStatus(opType) {
    var props = this.props;
    var tenantEnvCode = props.tenantEnvCode;
    props.actions.resetBuildStatus(props.model, tenantEnvCode, opType);
  },
  processBuildProgress() {
    var props = this.props;
    var data = props.data;
    var progress = data.get("progress") || 0;
    var status = data.get("status");
    var opType = data.get("opType");

    var logIndex = props.logIndex;
    // console.warn("status", status, "opType", opType, "progress", progress, "instanceId", data.has("instanceId"));

    // process success/failure
    if (status > 1) {
      this.resetBuildStatus(opType);

      if (status === 2) {
        if (opType === "deploy") {
          this.queryCompResources();
        } else if (opType === "compile") {
          this.queryCompileHistory();
        }
      }
      return;
    }

    // status in 1, process in progressTimer
    // don't have progress, response from click comiple/deploy button
    if (!data.has("progress")) {
      if (!data.has("instanceId")) { // just click comiple/deploy button
        return;
      }
      // fire query process in 1 second, response from compile/deploy
      this.progressTimer = setTimeout(this.queryProgressRate.bind(this, data.get("instanceId")), 1000);
      this.logTimer = setTimeout(this.queryBuildLogs.bind(this, data.get("instanceId")), 1000)
      return;
    }
    this.progressTimer = setTimeout(this.queryProgressRate.bind(this, data.get("instanceId")), 5000);
    this.logTimer = setTimeout(this.queryBuildLogs.bind(this, data.get("instanceId")), 5000)
  },
  componentWillUnmount() {
    clearTimeout(this.progressTimer);
    clearTimeout(this.logTimer);
  },
  renderBtnGroup() {
    var props = this.props;
    var type = props.type;
    var data = props.data;
    var buttons;
    if (type === 'compile') {
      buttons = (<CompileBtnGroup actions={ this.props.actions } buildHistories={ props.buildHistories } model={ props.model } data={ data } type={ type }
                 />)
    }
    if (type === 'deploy') {
      buttons = (<DeployBtnGroup actions={ this.props.actions } activateConsole={ props.activateConsole } buildHistories={ props.buildHistories } model={ props.model } data={ data }
                   type={ type } />)
    }
    return buttons;
  },
  render() {
    return (<div className="product-deploy-componentDeployToolbar">
              { this.renderBtnGroup() }
            </div>)
  }
})

export default DeployToolbar
