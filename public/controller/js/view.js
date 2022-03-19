export class View {
  constructor() {
    this.$btnStart = document.getElementById("start");
    this.$btnStop = document.getElementById("stop");
    this.buttons = Array.from(document.querySelectorAll("button"));
    this.ignoreClasses = new Set(["unassigned"]);
    const onBtnClick = async () => {};
    this.onBtnClick = onBtnClick;
    this.DISABLED_BTN_TIMEOUT = 200;
  }

  onLoad() {
    this.changeCommandBtnsVisibility();
    this.$btnStart.onclick = this.onStartClicked.bind(this);
    this.$btnStop.onclick = this.onStopClicked.bind(this);
  }

  changeCommandBtnsVisibility(hide = true) {
    Array.from(document.querySelectorAll("[name=command]")).forEach((btn) => {
      const fn = hide ? "add" : "remove";

      btn.classList[fn]("unassigned");
      const onClickReset = () => {};
      btn.onclick = onClickReset;
    });
  }

  configureOnBtnClick(fn) {
    this.onBtnClick = fn;
  }

  notIsUnassignedBtn(btn) {
    const classes = Array.from(btn.classList);
    return !!!classes.find((item) => this.ignoreClasses.has(item));
  }

  setupBtnAction(btn) {
    const text = btn.innerText.toLowerCase();
    if (text.includes("start")) return;
    if (text.includes("stop")) return;

    btn.onclick = this.onCommandClick.bind(this);
  }

  async onCommandClick(btn) {
    const {
      srcElement: { innerText, classList },
    } = btn;

    this.toggleDisabledCommandBtn(classList);
    await this.onBtnClick(innerText);
    setTimeout(
      () => this.toggleDisabledCommandBtn(classList),
      this.DISABLED_BTN_TIMEOUT
    );
  }

  toggleDisabledCommandBtn(classList) {
    if (!classList.contains("active")) {
      classList.add("active");
      return;
    }

    classList.remove("active");
  }

  async onStartClicked({ srcElement: { innerText } }) {
    const btnText = innerText;
    await this.onBtnClick(btnText);
    this.toggleBtnStart(false);
    this.changeCommandBtnsVisibility(false);

    this.buttons
      .filter((btn) => this.notIsUnassignedBtn(btn))
      .forEach(this.setupBtnAction.bind(this));
  }

  async onStopClicked({ srcElement: { innerText } }) {
    const btnText = innerText;
    await this.onBtnClick(btnText);
    this.toggleBtnStart();
    this.changeCommandBtnsVisibility();
  }

  toggleBtnStart(active = true) {
    if (active) {
      this.$btnStart.classList.remove("hidden");
      this.$btnStop.classList.add("hidden");
      return;
    }

    this.$btnStart.classList.add("hidden");
    this.$btnStop.classList.remove("hidden");
  }
}
