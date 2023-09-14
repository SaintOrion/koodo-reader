import React from "react";
import "./popupMenu.css";
import PopupOption from "../popupOption";
import { PopupMenuProps, PopupMenuStates } from "./interface";

class PopupMenu extends React.Component<PopupMenuProps, PopupMenuStates> {
  highlighter: any;
  timer!: NodeJS.Timeout;
  key: any;
  mode: string;
  showNote: boolean;
  isFirstShow: boolean;
  rect: any;
  constructor(props: PopupMenuProps) {
    super(props);
    this.showNote = false;
    this.isFirstShow = false;
    this.highlighter = null;
    this.mode = "";
    this.state = {
      deleteKey: "",
      rect: this.props.rect,
      isRightEdge: false,
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps: PopupMenuProps) {
    if (nextProps.rect !== this.props.rect) {
      this.setState(
        {
          rect: nextProps.rect,
        },
        () => {
          console.log("open", nextProps.rect, this.props.rect);
          this.openMenu();
        }
      );
    }
  }

  handleShowDelete = (deleteKey: string) => {
    this.setState({ deleteKey });
  };
  showMenu = () => {
    console.log(this.state.rect);
    let rect = this.state.rect;
    if (!rect) return;
    this.setState({ isRightEdge: false }, () => {
      let { posX, posY } =
        this.props.currentBook.format !== "PDF"
          ? this.getHtmlPosition(rect)
          : this.getPdfPosition(rect);
      this.props.handleOpenMenu(true);
      let popupMenu = document.querySelector(".popup-menu-container");
      popupMenu?.setAttribute("style", `left:${posX}px;top:${posY}px`);
    });
  };
  getPdfPosition(rect: any) {
    let posY = rect.bottom;
    let posX = rect.left + rect.width / 2;
    document
      .querySelector(".ebook-viewer")
      ?.setAttribute("style", "height:100%; overflow: hidden;");
    let pageArea = document.getElementById("page-area");
    if (!pageArea) return;
    let iframe = pageArea.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc: any = iframe.contentWindow || iframe.contentDocument?.defaultView;
    console.log(rect.bottom, doc.document.body.scrollHeight - 188);
    if (rect.bottom < doc.document.body.scrollHeight - 188) {
      this.props.handleChangeDirection(true);
      posY = posY + 16;
    } else {
      posY = posY - rect.height - 188;
    }
    posX = posX - 80;
    return { posX, posY } as any;
  }
  getHtmlPosition(rect: any) {
    let posY = rect.bottom - this.props.rendition.getPageSize().scrollTop;
    let posX = rect.left + rect.width / 2;
    if (
      posY <
      this.props.rendition.getPageSize().height -
        188 +
        this.props.rendition.getPageSize().top
    ) {
      this.props.handleChangeDirection(true);
      posY = posY + 16 + this.props.rendition.getPageSize().top;
    } else {
      posY = posY - rect.height - 188 + this.props.rendition.getPageSize().top;
    }
    posX = posX - 80 + this.props.rendition.getPageSize().left;
    let pageArea = document.getElementById("page-area");
    if (!pageArea) return;
    let iframe = pageArea.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc: any = iframe.contentDocument;
    if (!doc) {
      return;
    }
    return { posX, posY } as any;
  }

  //控制弹窗
  openMenu = () => {
    this.setState({ deleteKey: "" });
    let pageArea = document.getElementById("page-area");
    if (!pageArea) return;
    let iframe = pageArea.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc = iframe.contentDocument;
    if (!doc) return;
    let sel = doc.getSelection();
    this.props.handleChangeDirection(false);
    // 如果 popmenu正在被展示，则隐藏
    if (this.props.isOpenMenu) {
      this.props.handleMenuMode("menu");
      this.props.handleOpenMenu(false);
      this.props.handleNoteKey("");
    }
    if (!sel) return;
    // 使弹出菜单更加灵活可控;
    if (sel.isCollapsed) {
      this.props.isOpenMenu && this.props.handleOpenMenu(false);
      this.props.handleMenuMode("menu");
      this.props.handleNoteKey("");
      return;
    }
    this.showMenu();
    this.props.handleMenuMode("menu");
  };

  render() {
    const PopupProps = {
      chapterDocIndex: this.props.chapterDocIndex,
      chapter: this.props.chapter,
    };
    return (
      <div>
        <div
          className="popup-menu-container"
          style={this.props.isOpenMenu ? {} : { display: "none" }}
        >
          <div className="popup-menu-box">
            {this.props.menuMode === "menu" ? (
              <PopupOption {...PopupProps} />
            ) : null}
            <span
              className="icon-close popup-close"
              onClick={() => {
                this.props.handleOpenMenu(false);
              }}
              style={this.props.isChangeDirection ? { top: "180px" } : {}}
            ></span>
          </div>
          {this.props.menuMode === "menu" &&
            (this.props.isChangeDirection ? (
              <span className="icon-popup popup-menu-triangle-up"></span>
            ) : (
              <span className="icon-popup popup-menu-triangle-down"></span>
            ))}
        </div>
      </div>
    );
  }
}

export default PopupMenu;
