import React from 'react'
import _ from 'lodash'
import ReactDOM from 'react-dom'
import CustomizedShape from './CustomizedShape'
import Select from '../../../../core/Select'
import { ButtonToolbar, Button, Form, FormGroup, Col, FormControl, ControlLabel } from 'react-bootstrap'
import { i18n } from 'euler-ui'
import utils from '../../../../core/utils'
import UploadPanel from '../compile/UploadPanel'

var DeployComponentDiagram = React.createClass({
  componentDidUpdate(prevProps, prevState) {
    var data = this.props.data;
    var logIndex = this.props.logIndex;
    if (data && data.get("status")) {
      this.shape.updateProgress(data, logIndex);
    }
  },
  componentWillUnmount() {
    this.shape.cleanTimers();
  },
  componentDidMount() {
    this.shape = new CustomizedShape(this);
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
  shouldComponentUpdate(nextProps, nextState) {
    var data = this.props.data;
    var nextData = nextProps.data;
    if (data === nextData) {
      return false;
    }
    return true;
  },
  render() {
    return (<div ref="deploy-diagram" className="product-deploy-componentDiagram"></div>)
  }
})
var DeployInfo = React.createClass({
  render() {
    var props = this.props;
    var component = props.component;
    var resource = props.resource;
    var resComp;
    if (resource) {
      resComp = (<FormGroup>
                   <Col componentClass={ ControlLabel } xs={ 4 }>
                   { i18n.get("product.deploy.visitUrl") }
                   </Col>
                   <Col xs={ 8 }>
                   <FormControl.Static>
                     <a href={ resource.netUrl } target="_blank">
                       { resource.netUrl }
                     </a>
                   </FormControl.Static>
                   </Col>
                 </FormGroup>)
    }
    return (<div className="product-deploy-componentDeployInfo">
              <Form horizontal>
                <FormGroup>
                  <Col componentClass={ ControlLabel } xs={ 4 }>
                  { i18n.get("component.code") }
                  </Col>
                  <Col xs={ 8 }>
                  <FormControl.Static>
                    { component.code }
                  </FormControl.Static>
                  </Col>
                </FormGroup>
                <FormGroup>
                  <Col componentClass={ ControlLabel } xs={ 4 }>
                  { i18n.get("component.version") }
                  </Col>
                  <Col xs={ 8 }>
                  <FormControl.Static>
                    { component.version }
                  </FormControl.Static>
                  </Col>
                </FormGroup>
                { resComp }
              </Form>
            </div>)
  }
})

var BuildNum = React.createClass({
  componentDidUpdate(prevProps, prevState) {
    this.setBuildOptions();
  },
  componentDidMount() {
    this.setBuildOptions();
  },
  setBuildOptions() {
    var options = this.props.options;
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
      <Select ref="selector" getValue={ (this.props.type === "compile") ? this.getBuildNumValue : "" } valueKey="buildNumber" labelKey="buildNumber" options={ [] } wrapperClassName="col-xs-12" />
      );
  }
})
var DeployToolbar = React.createClass({
  contextTypes: {
    code: React.PropTypes.string
  },
  getInitialState() {
    return {
      commitIsSelected: false
    };
  },
  compileComponent(ref, isRelease) {
    var commitNum = this.refs[ref].getValue();
    this.props.compileComponent(commitNum, isRelease);
  },
  packageComponent() {
    var buildNum = this.refs.buildNum.getValue();
    this.props.packageComponent(buildNum);
  },
  labelRenderer(item) {
    return "[" + (utils.getFormattedDate(item.committedDate) || "") + "] [" + (item.committedUser || "") + "] [" + (item.comment || "") + "]";
  },
  afterCommitSelectInit() {
    if (this.refs.commitNum.getValue()) {
      this.setState({
        commitIsSelected: true
      })
    }
  },
  genBuildOptions() {
    return _.filter(this.props.buildHistories, (history) => {
      return history.buildResultCode === 100;
    })
  },
  render() {
    var props = this.props;
    var model = props.model;
    var data = props.data;
    var inProgress = false;
    var isPackging = false;
    var isDeploying = false;
    var isCompiling = false;
    var isRelease = data && data.get("isRelease");
    var type = props.type;
    var buildOptions = this.genBuildOptions();
    var componentTypeId = props.model.componentType && props.model.componentType.id;
    var commitIsSelected = this.state.commitIsSelected;
    var buildIsSelected = !!buildOptions.length;
    if (data && data.get("status") === 1) {
      inProgress = true;
      if (data.get("opType") === "package") {
        isPackging = true;
      }
      if (data.get("opType") === "compile") {
        isCompiling = true;
      }
      if (data.get("opType") === "deploy") {
        isDeploying = true;
      }
    }
    var buttons;

    if (type === 'compile') {
      var uploadPanel;
      if (componentTypeId === 'javaee_app') {// WAR介质包上传功能
        uploadPanel = (
          <div className="product-deploy-componentDeployToolbar-group" style={ { height: 100 } }>
            <UploadPanel componentCode={ model.code } componentVersion={ model.version } />
          </div>
        )
      }
      buttons = (<div>
                   { uploadPanel }
                   <FormGroup className="product-deploy-componentDeployToolbar-group">
                     <Col componentClass={ ControlLabel } xs={ 2 }>
                     { i18n.get("product.deploy.commit") }
                     </Col>
                     <Col xs={ 6 }>
                     <Select ref="commitNum" afterInit={ this.afterCommitSelectInit } restParams={ { productCode: this.context.code } } valueKey="id" labelRenderer={ this.labelRenderer } url="/portal/repositories/products/:productCode/commits"
                       wrapperClassName="col-xs-12" />
                     </Col>
                     <Col xs={ 4 } style={ { textAlign: "right" } }>
                     <Button bsStyle="primary" disabled={ !commitIsSelected || inProgress } block onClick={ this.compileComponent.bind(this, "commitNum", false) }>
                       { isCompiling && !isRelease ? i18n.get("product.deploy.compiling") : i18n.get("product.deploy.compilingSnapshot") }
                     </Button>
                     </Col>
                   </FormGroup>
                   <FormGroup className="product-deploy-componentDeployToolbar-group">
                     <Col componentClass={ ControlLabel } xs={ 2 }>
                     { i18n.get("product.deploy.build") }
                     </Col>
                     <Col xs={ 6 }>
                     <BuildNum type={ type } ref="buildNum" options={ buildOptions } />
                     </Col>
                     <Col xs={ 4 } style={ { textAlign: "right" } }>
                     <Button bsStyle="primary" disabled={ !buildIsSelected || inProgress } block onClick={ this.compileComponent.bind(this, "buildNum", true) }>
                       { isCompiling && isRelease ? i18n.get("product.deploy.compiling") : i18n.get("product.deploy.compilingRelease") }
                     </Button>
                     </Col>
                   </FormGroup>
                 </div>)
    }
    if (type === 'deploy') {
      buttons = (<div>
                   <FormGroup className="product-deploy-componentDeployToolbar-group">
                     <Col componentClass={ ControlLabel } xs={ 2 }>
                     { i18n.get("product.deploy.build") }
                     </Col>
                     <Col xs={ 5 }>
                     <BuildNum type={ type } ref="buildNum" options={ buildOptions } />
                     </Col>
                     <Col xs={ 2 }>
                     <Button bsStyle="primary" block disabled={ !buildIsSelected || inProgress } onClick={ this.packageComponent }>
                       { isPackging ? i18n.get("product.deploy.packaging") : i18n.get("product.deploy.package") }
                     </Button>
                     </Col>
                     <Col xs={ 1 }>
                     <div className="product-deploy-componentDeployToolbar-splitter">|</div>
                     </Col>
                     <Col xs={ 2 }>
                     <Button bsStyle="primary" block disabled={ !buildIsSelected || inProgress } onClick={ this.props.openSpecModal }>
                       { isDeploying ? i18n.get("product.deploy.deploying") : i18n.get("product.deploy.name") }
                     </Button>
                     </Col>
                   </FormGroup>
                 </div>)
    }
    return (<div className="product-deploy-componentDeployToolbar">
              { buttons }
            </div>)
  }
})
var DeployComponent = React.createClass({
  compileComponent(commitVal, isRelease) {
    var props = this.props;
    var model = props.model;
    this.props.actions.compileComponent({
      componentCode: model.code,
      componentVersion: model.version,
      tenantEnvCode: props.tenantEnvCode,
      tenantCode: model.tenantCode,
      commitNumber: commitVal,
      isRelease: isRelease
    });
  },
  packageComponent(buildVal) {
    var props = this.props;
    var model = props.model;
    this.props.actions.packageComponent({
      componentCode: model.code,
      componentVersion: model.version,
      tenantEnvCode: props.tenantEnvCode,
      tenantCode: model.tenantCode,
      buildNumber: buildVal
    });
    this.props.activateConsole();
  },
  openSpecModal() {
    var props = this.props;
    var model = props.model;
    this.props.actions.openSpecModal(model, props.tenantEnvCode);
  },
  render() {
    return (<div className="product-deploy-component">
              <div className="product-deploy-component-main">
                <DeployInfo type={ this.props.type } component={ this.props.model } resource={ this.props.resource } />
                <DeployComponentDiagram {...this.props} ref="dd" />
              </div>
              <DeployToolbar buildHistories={ this.props.buildHistories } type={ this.props.type } model={ this.props.model } data={ this.props.data } compileComponent={ this.compileComponent }
                packageComponent={ this.packageComponent } openSpecModal={ this.openSpecModal } />
            </div>)
  }
})
var DeployDiagram = React.createClass({
  componentDidMount() {
    var props = this.props;
    var component = props.diagram.get("component");
    var type = props.type;
    var actions = props.actions;
    actions.queryProgress(component.code, component.version, props.type, props.tenantEnvCode);
    actions.queryCompileHistory(component.code, component.version, component.tenantCode, props.tenantEnvCode);
    if (type !== 'compile') {
      actions.queryCompResources(component, props.tenantEnvCode);
    }
  },
  render() {
    var props = this.props;
    var tenantEnvCode = props.tenantEnvCode;
    var diagramProps = props.diagram;
    var component = diagramProps.get("component");
    var build = diagramProps.get("build");
    var logIndex = diagramProps.get("logStartIndex");
    var resource = diagramProps.get("resource");
    var buildHistories = diagramProps.get("histories");
    return (
      <div className="product-deploy-diagram">
        <DeployComponent activateConsole={ this.props.activateConsole } key={ component.id } buildHistories={ buildHistories } logIndex={ logIndex } activateCompileHistory={ props.activateCompileHistory }
          resource={ resource } type={ props.type } data={ build } actions={ props.actions } model={ component } tenantEnvCode={ tenantEnvCode }
        />
      </div>)
  },
  shouldComponentUpdate(nextProps) {
    var props = this.props;
    var envCode = props.tenantEnvCode;
    var envState = props.diagram;
    var nextEnvState = nextProps.diagram;
    if (envState && (envState.get("logStartIndex") === nextEnvState.get("logStartIndex"))
      && (envState.get("histories") === nextEnvState.get("histories"))
      && (envState.get("component") === nextEnvState.get("component"))
      && (envState.get("build") === nextEnvState.get("build"))
      && (envState.get("resource") === nextEnvState.get("resource"))) {
      return false;
    }
    return true;
  }
})

export default DeployDiagram
