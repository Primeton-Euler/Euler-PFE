import React from 'react'
import { Button, Image } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'
import { i18n , Notify} from 'euler-ui'
import { browserHistory} from 'react-router'
import ModalBox from '../../commons/ModalBox'

var MarketProductCard = React.createClass({
  componentDidMount(){
    var props = this.props;
    if ("purchased" == props.from) {
      if ("1" == props.model.statusId) {
        this.statusTimer = setTimeout(function () {
          props.actions.getProductStatus(props.model.id)
        }, 5000);
      } else {
        this.clearTimer();
      }
    }
  },
  clearTimer(){
    clearTimeout(this.statusTimer);
  },
  handleOffline() {
    var standardProductId = this.props.model.id;
    var userName = JSON.parse(sessionStorage.getItem("userInfo")).userName;
    this.props.actions.offlineStandardProduct(standardProductId, userName);
  },
  customerProductOpen(){
    var customerProductUrl = this.props.model.productOpenUrl;
    var accessToken = window.sessionStorage.getItem("x-cbc-accessToken");
    var tenantCode = window.sessionStorage.getItem("tenantCode");
    var standardProductId = this.props.model.id;
    window.open(customerProductUrl+"?params="+accessToken+","+tenantCode+","+standardProductId);
  },
  openDetail(){
    var customerProductDetailUrl = this.props.model.productDetailUrl;
    var accessToken = window.sessionStorage.getItem("x-cbc-accessToken");
    var tenantCode = window.sessionStorage.getItem("tenantCode");
    var productInstId = this.props.model.id;
    window.open(customerProductDetailUrl+"?params="+accessToken+","+tenantCode+","+productInstId);
  },
  sureToDelete(productInstanceId,userName){
    this.props.actions.deleteProductInstance(productInstanceId, userName);
    browserHistory.replace("/home/market/2");
  },
  handleDelete() {
    var productInstanceId = this.props.model.id;
    var userName = JSON.parse(sessionStorage.getItem("userInfo")).userName;
    ModalBox.createConfirm({
      title: i18n.get("common.delete"),
      text: i18n.get("market.confirmDelete"),
      confirmFn:this.sureToDelete.bind(this, productInstanceId, userName)
    });
  },
  render() {
    var props = this.props;
    var model = "";
    if(this.props.productStatus.id == props.model.id){
      model = this.props.productStatus;
    }else {
      model = props.model;
    }
    var productType = props.productType;
    var logo = "/images/market/" + (model.logo ? model.logo : "mkt_icon1.png");
    var btnView = "";
    var viewTag = "";
    if (productType == 1) {
      viewTag = model.productOfferType ? model.productOfferType.id : "";
      if (viewTag == 1) {
        btnView = (
          <LinkContainer to={ { pathname: `/home/market/product/${model.id}` } }>
            <Button active>{i18n.get("market.choose")}</Button>
          </LinkContainer>);
      }
      if (5 == viewTag) {
        btnView = (<Button active onClick={this.customerProductOpen}>{i18n.get("market.choose")}</Button>);
      }

    } else if (productType == 2) {
      var button = "";
      viewTag = model.offerId ? model.offerId : "";
      // statusId  1  正在创建  2  创建失败  3 创建成功  4 停止  5 删除失败
      if (3 == model.statusId) {
        //自定义产品
        if (5 == viewTag) {
          button = (
            <Button bsStyle="success" onClick={this.openDetail}>{i18n.get("market.chosen")}</Button>
          );
        } else {
          button = (<LinkContainer to={ { pathname: `/home/market/purchasedProduct/${model.id}` } }>
            <Button bsStyle="success">{i18n.get("market.chosen")}</Button>
          </LinkContainer>);
        }
      } else if (2 == model.statusId || 5 == model.statusId) {
        button = (
          <div>
            <Button bsStyle="warning" disabled>{i18n.get("market.fail")}</Button>
            <Button bsStyle="danger" className="market-btn-delete" onClick={ this.handleDelete } active>{i18n.get("market.purchasedProduct.delete")}</Button>
          </div>
        );
      } else {
        button = (
          <Button bsStyle="warning" disabled>{i18n.get("market.creating")}</Button>
        );
      }
      btnView = (
        <div>
          {button}
        </div>);

    } else if (productType == 3) {
      viewTag = model.productOfferType ? model.productOfferType.id : "";
      if(model.statusId == "1") {
        btnView = <div className="title">{i18n.get("market.auditing")}</div>
      } else if(model.statusId == "2") {
        btnView = (
          <Button onClick={ this.handleOffline } active>{i18n.get("market.offline")}</Button>);
      } else if(model.statusId == "3") {
        btnView = <div className="title">{i18n.get("market.offline")}</div>
      } else if(model.statusId == "4") {
        btnView = <div className="title">{i18n.get("market.releaseFailed")}</div>
      }
    }
    if ("purchased" == props.from) {
      if ("1" == model.statusId) {
        this.statusTimer = setTimeout(function () {
          props.actions.getProductStatus(model.id)
        }, 5000);
      } else {
        this.clearTimer();
      }
    }
    return (
      <section className="market-product-card">
        <Image className="market-product-icon" src={logo} rounded/>
        <div className="market-product-intro">
          <div className="title" title={model.standardProductName}>{model.standardProductName}</div>
          <div className="title" title={model.productVersion}>{model.productVersion}</div>
          <div className="title" title={model.tag}>{model.tag}</div>
          {
            "5" == viewTag ? (
              <div className="title">自定义产品</div>
            ) : (
              <div className="title">标准产品</div>
            )
          }
          {btnView}
        </div>
      </section>
    )

  }
})

export default MarketProductCard