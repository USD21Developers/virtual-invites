class PWAInstallBanner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.defaults = {
      title: "The Invites App",
      organization: "International Christian Churches",
      buttonText: "INSTALL",
      installUrl: "/install/",
    };
  }

  static get observedAttributes() {
    return [
      "data-title",
      "data-organization",
      "data-button-text",
      "data-install-url",
      "data-hide-if-dismissed",
    ];
  }

  attributeChangedCallback() {
    this.render();
  }

  connectedCallback() {
    this.render();
    this.show();
  }

  render() {
    const title = this.getAttribute("data-title") || this.defaults.title;
    const organization =
      this.getAttribute("data-organization") || this.defaults.organization;
    const buttonText =
      this.getAttribute("data-button-text") || this.defaults.buttonText;
    const installUrl =
      this.getAttribute("data-install-url") || this.defaults.installUrl;
    const hideIfDismissed = this.hasAttribute("data-hide-if-dismissed");

    this.shadowRoot.innerHTML = `
      <style>
        #installBanner {
          position: absolute;
          top: 0;
          left: 0;
          background-color: #f2f2f6;
          border-bottom: 1px solid #bbb;
          padding: 5px 0;
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
          text-decoration: none;
        }
      </style>
      <div id="installBanner">
        <button id="closeButton" class="close">&times;</button>
        <div class="box flex">
          <img src="/android-chrome-192x192.png" width="50" style="border-radius: 12px; max-height: 48px;" />
        </div>
        <div class="box">
          <div class="title">
            ${title}
          </div>
          <div class="muted">
            ${organization}
          </div>
        </div>
        <div class="box" style="margin-left: auto;">
          <a href="${installUrl}" id="installBannerButton">
            ${buttonText}
          </a>
        </div>
      </div>
    `;

    // Call setupEventListeners after rendering
    this.setupEventListeners();

    if (hideIfDismissed) {
      const wasDismissed = localStorage.getItem("pwaInstallBannerDismissed");

      if (!!wasDismissed) {
        this.hide();
      }
    }
  }

  setupEventListeners() {
    const closeButton = this.shadowRoot.querySelector("#closeButton");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        if (this.hasAttribute("data-hide-if-dismissed")) {
          localStorage.setItem("pwaInstallBannerDismissed", "true");
        }
        this.hide();
      });
    }
  }

  show() {
    if (this.hasAttribute("data-hide-if-dismissed")) {
      const pwaInstallBannerDismissed = localStorage.getItem(
        "pwaInstallBannerDismissed"
      );

      if (!pwaInstallBannerDismissed) {
        this.parentElement.classList.add("pwaInstallBanner");
      }
    } else {
      this.parentElement.classList.add("pwaInstallBanner");
    }
  }

  hide() {
    this.parentElement.classList.remove("pwaInstallBanner");
  }
}

customElements.define("pwa-install-banner", PWAInstallBanner);
