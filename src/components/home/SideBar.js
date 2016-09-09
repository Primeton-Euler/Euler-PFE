import React from 'react';
import { Nav, Image } from 'react-bootstrap';
import _ from 'lodash';
import { Link } from 'react-router';
import { i18n } from 'euler-ui';

var SideBar = React.createClass({
  getDefaultProps() {
    return {
      items: [
        {
          id: "home",
          name: i18n.get("home.sideBar.product"),
          path: "/images/home/product.svg",
          link: "/home"
        },
        {
          id: "market",
          name: i18n.get("home.sideBar.market"),
          path: "/images/home/market.svg",
          link: "/home/market"
        },
        {
          id: "tenant",
          name: i18n.get("home.sideBar.tenant"),
          path: "/images/home/tenant.svg",
          link: "/home/tenant"
        },
        {
          id: "platform",
          name: i18n.get("home.sideBar.platform"),
          path: "/images/home/platform.svg",
          link: "/home/approval"
        }
      ]
    };
  },
  handleSelect() {
  },
  render() {
    var items = this.props.items;
    var userInfo = JSON.parse(sessionStorage.getItem("userInfo")) || {};
    var navs = [];

    for(var i = 0; i < items.length; i++) {
      var item = items[i];
      if(item.id == "tenant" && !userInfo.isTM) {
        continue;
      }
      if(item.id == "platform" && !userInfo.isPFM) {
        continue;
      }
      var className = 'home-nav-item-' + item.id;
      navs.push(
        <li className={ className } key={ item.id }>
          <Link to={ item.link }>
            <Image src={ item.path }/>
            <span>{ item.name }</span>
          </Link>
        </li>
      )
    }
    return (
      <aside className="home-sideBar">
        <Nav bsStyle="pills" stacked onSelect={ this.handleSelect }>
          { navs }
        </Nav>
      </aside>
    );
  }
});
export default SideBar
