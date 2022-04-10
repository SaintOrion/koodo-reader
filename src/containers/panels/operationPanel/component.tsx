import React from "react";
import "./operationPanel.css";
import Bookmark from "../../../model/Bookmark";
import { Trans } from "react-i18next";
import localforage from "localforage";
import RecordLocation from "../../../utils/readUtils/recordLocation";
import { OperationPanelProps, OperationPanelState } from "./interface";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";
import ReadingTime from "../../../utils/readUtils/readingTime";
import { withRouter } from "react-router-dom";
import toast from "react-hot-toast";
declare var document: any;

class OperationPanel extends React.Component<
  OperationPanelProps,
  OperationPanelState
> {
  timeStamp: number;
  speed: number;
  timer: any;

  constructor(props: OperationPanelProps) {
    super(props);
    this.state = {
      isFullScreen:
        StorageUtil.getReaderConfig("isFullScreen") === "yes" ? true : false, // 是否进入全屏模式
      isBookmark: false, // 是否添加书签
      time: 0,
      currentPercentage: RecordLocation.getHtmlLocation(
        this.props.currentBook.key
      )
        ? RecordLocation.getHtmlLocation(this.props.currentBook.key).percentage
        : 0,
      timeLeft: 0,
    };
    this.timeStamp = Date.now();
    this.speed = 30000;
  }

  componentDidMount() {
    const exitHandler = () => {
      if (
        document.webkitIsFullScreen ||
        document.mozFullScreen ||
        document.msFullscreenElement !== null
      ) {
        this.setState({ isFullScreen: !this.state.isFullScreen });
        StorageUtil.setReaderConfig(
          "isFullScreen",
          this.state.isFullScreen ? "no" : "yes"
        );
      }
    };
    if (document.addEventListener) {
      document.addEventListener(
        "fullscreenchange",
        () => {
          exitHandler();
        },
        false
      );
      document.addEventListener(
        "mozfullscreenchange",
        () => {
          exitHandler();
        },
        false
      );
      document.addEventListener(
        "MSFullscreenChange",
        () => {
          exitHandler();
        },
        false
      );
      document.addEventListener(
        "webkitfullscreenchange",
        () => {
          exitHandler();
        },
        false
      );
    }
    this.props.htmlBook.rendition.on("page-changed", async () => {
      this.speed = Date.now() - this.timeStamp;
      this.timeStamp = Date.now();
      let pageProgress = await this.props.htmlBook.rendition.getProgress();
      this.setState({
        timeLeft:
          ((pageProgress.totalPage - pageProgress.currentPage) * this.speed) /
          1000,
      });
    });
  }
  // 点击切换全屏按钮触发
  handleScreen() {
    !this.state.isFullScreen
      ? this.handleFullScreen()
      : this.handleExitFullScreen();
  }
  // 点击退出按钮的处理程序
  handleExit() {
    StorageUtil.setReaderConfig("isFullScreen", "no");
    this.props.handleReadingState(false);
    window.speechSynthesis.cancel();
    ReadingTime.setTime(this.props.currentBook.key, this.props.time);
    this.handleExitFullScreen();
    if (this.props.htmlBook) {
      this.props.handleHtmlBook(null);
    }
  }
  //控制进入全屏
  handleFullScreen() {
    let de: any = document.documentElement;
    if (de.requestFullscreen) {
      de.requestFullscreen();
    } else if (de.mozRequestFullScreen) {
      de.mozRequestFullScreen();
    } else if (de.webkitRequestFullscreen) {
      de.webkitRequestFullscreen();
    } else if (de.msRequestFullscreen) {
      de.msRequestFullscreen();
    }

    // this.setState({ isFullScreen: true });
    // StorageUtil.setReaderConfig("isFullScreen", "yes");
  }
  // 退出全屏模式
  handleExitFullScreen() {
    //解决使用esc退出全屏，再退出阅读时发生的bug
    if (!document.fullscreenElement) return;

    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }

    // this.setState({ isFullScreen: false });
    // StorageUtil.setReaderConfig("isFullScreen", "no");
  }
  handleAddBookmark = async () => {
    let bookKey = this.props.currentBook.key;
    let bookLocation = RecordLocation.getHtmlLocation(bookKey);
    let text = bookLocation.text;
    let chapter = bookLocation.chapterTitle;
    let percentage = bookLocation.percentage;

    let cfi = JSON.stringify(bookLocation);

    text = text
      .replace(/\s\s/g, "")
      .replace(/\r/g, "")
      .replace(/\n/g, "")
      .replace(/\t/g, "")
      .replace(/\f/g, "");

    let bookmark = new Bookmark(
      bookKey,
      cfi,
      text.substr(0, 200),
      percentage,
      chapter
    );
    let bookmarkArr = this.props.bookmarks ?? [];
    bookmarkArr.push(bookmark);
    this.props.handleBookmarks(bookmarkArr);
    localforage.setItem("bookmarks", bookmarkArr);
    this.setState({ isBookmark: true });
    toast.success(this.props.t("Add Successfully"));
    this.props.handleShowBookmark(true);
  };

  render() {
    return (
      <div className="book-operation-panel">
        <div className="book-opeartion-info">
          <span>
            <Trans
              i18nKey="Current Reading Time"
              count={Math.floor(Math.abs(Math.floor(this.props.time / 60)))}
            >
              Current Reading Time:
              {{
                count: Math.abs(Math.floor(this.props.time / 60)),
              }}
              min
            </Trans>
          </span>
          &nbsp;&nbsp;&nbsp;
          <span>
            <Trans
              i18nKey="Finish Reading Time"
              count={Math.ceil(this.state.timeLeft / 60)}
            >
              Finish Reading Time:
              {{
                count: `${Math.ceil(this.state.timeLeft / 60)}`,
              }}
              min
            </Trans>
          </span>
        </div>
        <div
          className="exit-reading-button"
          onClick={() => {
            this.handleExit();

            if (StorageUtil.getReaderConfig("isOpenInMain") === "yes") {
              this.props.history.push("/manager/home");
              document.title = "Koodo Reader";
            } else {
              window.close();
            }
          }}
        >
          <span className="icon-exit exit-reading-icon"></span>
          <span className="exit-reading-text">
            <Trans>Exit</Trans>
          </span>
        </div>
        <div
          className="add-bookmark-button"
          onClick={() => {
            this.handleAddBookmark();
          }}
        >
          <span className="icon-add add-bookmark-icon"></span>
          <span className="add-bookmark-text">
            <Trans>Add Bookmark</Trans>
          </span>
        </div>
        <div
          className="enter-fullscreen-button"
          onClick={() => {
            this.handleScreen();
          }}
        >
          <span className="icon-fullscreen enter-fullscreen-icon"></span>
          {!this.state.isFullScreen ? (
            <span className="enter-fullscreen-text">
              <Trans>Enter Fullscreen</Trans>
            </span>
          ) : (
            <span className="enter-fullscreen-text">
              <Trans>Exit Fullscreen</Trans>
            </span>
          )}
        </div>
      </div>
    );
  }
}

export default withRouter(OperationPanel);
