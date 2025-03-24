class PWAInstallBanner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.show();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        #installBanner {
          position: absolute;
          visibility: hidden;
          top: 0;
          left: 0;
          background-color: #f2f2f6;
          border-bottom: 1px solid #bbb;
          min-height: 56px;
          padding: 3px 0;
          width: 100%;
          display: flex;
          align-items: center;
          font-family: Arial, sans-serif;
        }
        #installBanner .box {
          margin: 0 10px 0 0;
        }
        .flex {
          display: flex;
        }
        .close {
          background: none;
          border: none;
          color: #aaa;
          font-size: 25px;
          cursor: pointer;
          margin-top: 3px;
          padding-left: 15px;
          padding-right: 15px;
        }
        .title { font-weight: bold; }
        .muted { color: #999; font-size: 13px; }
        #installBannerButton {
          color: white;
          background-color: #3478f6;
          border-radius: 40px;
          padding: 6px 13px;
          font-weight: 600;
          text-transform: uppercase;
          text-decoration: none;
        }
      </style>
      <div id="installBanner">
        <div>
          <button class="close">&times;</button>
        </div>
        <div class="box flex">
          <img src="/android-chrome-192x192.png" width="50" style="border-radius: 12px; max-height: 48px;" />
        </div>
        <div class="box">
          <div class="title">
            ${getGlobalPhrase("installBannerTitle")}
          </div>
          <div class="muted">
            ${getGlobalPhrase("installBannerOrganization")}
          </div>
        </div>
        <div class="box" style="margin-left: auto;">
          <a href="/install/" id="installBannerButton">
            ${getGlobalPhrase("installBannerButton")}
          </a>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    this.shadowRoot
      .querySelector(".close")
      .addEventListener("click", () => this.hide());
  }

  show() {
    const banner = this.shadowRoot.querySelector("#installBanner");
    banner.style.visibility = "visible";
    this.style.marginTop = `${banner.clientHeight + 5}px`;
  }

  hide() {
    const banner = this.shadowRoot.querySelector("#installBanner");
    banner.style.visibility = "hidden";
    this.style.marginTop = "auto";
  }
}

customElements.define("pwa-install-banner", PWAInstallBanner);
