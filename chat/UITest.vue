<template>
  <modal
    :action="l('ui.test')"
    ref="dialog"
    dialogClass="modal-fullscreen"
    iconClass="fas fa-code"
    :buttons="false"
  >
    <tabs
      style="flex-shrink: 0; margin-bottom: 10px"
      v-model="selectedTab"
      :fullWidth="true"
      :tabs="[l('ui.genericItems'), l('ui.messages'), l('ui.messages.modern')]"
    ></tabs>

    <div v-show="selectedTab === '0'">
      <div>
        <h2>Buttons</h2>
        <button class="btn btn-primary">Primary</button>

        <button class="btn btn-secondary">Secondary</button>

        <button class="btn btn-warning">Warning</button>
        <button class="btn btn-danger">Danger</button>
        <button class="btn btn-success">Success</button>
        <button class="btn btn-info">Info</button>

        <button class="btn btn-dark">Dark</button>
        <button class="btn btn-light">Light</button>
      </div>

      <div>
        <h2>Outline buttons</h2>
        <button class="btn btn-outline-primary">Primary</button>

        <button class="btn btn-outline-secondary">Secondary</button>

        <button class="btn btn-outline-warning">Warning</button>
        <button class="btn btn-outline-danger">Danger</button>
        <button class="btn btn-outline-success">Success</button>
        <button class="btn btn-outline-info">Info</button>

        <button class="btn btn-outline-dark">Dark</button>
        <button class="btn btn-outline-light">Light</button>
      </div>

      <div>
        <h2>Conversation list</h2>

        <div
          class="list-group conversation-nav"
          style="width: 200px; display: inline-block"
        >
          <a
            href="#"
            class="list-group-item list-group-item-action item-channel"
            ><span class="name">Penthouse</span
            ><span
              ><span
                aria-label="Pin this tab"
                class="pin fas fa-thumbtack"
              ></span
              ><span
                aria-label="Close this tab"
                class="fas fa-times leave"
              ></span></span
          ></a>
          <a
            href="#"
            class="list-group-item list-group-item-action item-channel"
            ><span class="name">Penthouse</span
            ><span
              ><span
                aria-label="Pin this tab"
                class="pin fas fa-thumbtack active"
              ></span
              ><span
                aria-label="Close this tab"
                class="fas fa-times leave"
              ></span></span
          ></a>
          <a
            href="#"
            class="list-group-item list-group-item-action item-channel list-group-item-danger"
            ><span class="name">Penthouse</span
            ><span
              ><span
                aria-label="Pin this tab"
                class="pin fas fa-thumbtack active"
              ></span
              ><span
                aria-label="Close this tab"
                class="fas fa-times leave"
              ></span></span
          ></a>
          <a
            href="#"
            class="list-group-item list-group-item-action item-channel list-group-item-danger"
            ><span class="name">Penthouse</span
            ><span
              ><span
                aria-label="Pin this tab"
                class="pin fas fa-thumbtack"
              ></span
              ><span
                aria-label="Close this tab"
                class="fas fa-times leave"
              ></span></span
          ></a>
          <a
            href="#"
            class="list-group-item list-group-item-action item-channel list-group-item-warning"
            ><span class="name">Penthouse</span
            ><span
              ><span
                aria-label="Pin this tab"
                class="pin fas fa-thumbtack active"
              ></span
              ><span
                aria-label="Close this tab"
                class="fas fa-times leave"
              ></span></span
          ></a>
          <a
            href="#"
            class="list-group-item list-group-item-action item-channel list-group-item-warning"
            ><span class="name">Penthouse</span
            ><span
              ><span
                aria-label="Pin this tab"
                class="pin fas fa-thumbtack"
              ></span
              ><span
                aria-label="Close this tab"
                class="fas fa-times leave"
              ></span></span
          ></a>
          <a
            href="#"
            class="list-group-item list-group-item-action item-channel active"
            ><span class="name">Penthouse</span
            ><span
              ><span
                aria-label="Pin this tab"
                class="pin fas fa-thumbtack"
              ></span
              ><span
                aria-label="Close this tab"
                class="fas fa-times leave"
              ></span></span
          ></a>
          <a
            href="#"
            class="list-group-item list-group-item-action item-channel active"
            ><span class="name">Penthouse</span
            ><span
              ><span
                aria-label="Pin this tab"
                class="pin fas fa-thumbtack active"
              ></span
              ><span
                aria-label="Close this tab"
                class="fas fa-times leave"
              ></span></span
          ></a>
        </div>
        <div
          class="list-group conversation-nav"
          style="width: 200px; display: inline-block"
        >
          <a
            href="#"
            data-character="Active"
            data-bs-touch="false"
            class="list-group-item list-group-item-action item-private active"
            ><img src="https://static.f-list.net/images/avatar/m.png" />
            <div class="name">
              <span>Mr. Test</span>
              <div style="line-height: 0; display: flex">
                <span class="fas fa-reply"></span
                ><span class="online-status offline fa fa-ban"></span
                ><span style="flex: 1 1 0%"></span
                ><span
                  aria-label="Pin this tab"
                  class="pin fas fa-thumbtack"
                ></span
                ><span
                  aria-label="Close this tab"
                  class="fas fa-times leave"
                ></span>
              </div></div
          ></a>
          <a
            href="#"
            data-bs-touch="false"
            class="list-group-item list-group-item-action item-private"
            ><img src="https://static.f-list.net/images/avatar/m.png" />
            <div class="name">
              <span>Offline user</span>
              <div style="line-height: 0; display: flex">
                <span class="fas fa-reply"></span
                ><span class="online-status offline fa fa-ban"></span
                ><span style="flex: 1 1 0%"></span
                ><span
                  aria-label="Pin this tab"
                  class="pin fas fa-thumbtack"
                ></span
                ><span
                  aria-label="Close this tab"
                  class="fas fa-times leave"
                ></span>
              </div></div
          ></a>
          <a
            href="#"
            data-bs-touch="false"
            class="list-group-item list-group-item-action item-private"
            ><img src="https://static.f-list.net/images/avatar/m.png" />
            <div class="name">
              <span>Online</span>
              <div style="line-height: 0; display: flex">
                <span class="fas fa-reply"></span
                ><span class="online-status online fas fa-circle"></span
                ><span style="flex: 1 1 0%"></span
                ><span
                  aria-label="Pin this tab"
                  class="pin fas fa-thumbtack"
                ></span
                ><span
                  aria-label="Close this tab"
                  class="fas fa-times leave"
                ></span>
              </div></div
          ></a>
          <a
            href="#"
            data-bs-touch="false"
            class="list-group-item list-group-item-action item-private"
            ><img src="https://static.f-list.net/images/avatar/m.png" />
            <div class="name">
              <span>Looking</span>
              <div style="line-height: 0; display: flex">
                <span class="fas fa-reply"></span
                ><span class="online-status online fa fa-eye"></span
                ><span style="flex: 1 1 0%"></span
                ><span
                  aria-label="Pin this tab"
                  class="pin fas fa-thumbtack"
                ></span
                ><span
                  aria-label="Close this tab"
                  class="fas fa-times leave"
                ></span>
              </div></div
          ></a>
          <a
            href="#"
            data-bs-touch="false"
            class="list-group-item list-group-item-action item-private"
            ><img src="https://static.f-list.net/images/avatar/m.png" />
            <div class="name">
              <span>Crown</span>
              <div style="line-height: 0; display: flex">
                <span class="fas fa-reply"></span
                ><span class="online-status online fas fa-crown"></span
                ><span style="flex: 1 1 0%"></span
                ><span
                  aria-label="Pin this tab"
                  class="pin fas fa-thumbtack"
                ></span
                ><span
                  aria-label="Close this tab"
                  class="fas fa-times leave"
                ></span>
              </div></div
          ></a>
          <a
            href="#"
            data-bs-touch="false"
            class="list-group-item list-group-item-action item-private"
            ><img src="https://static.f-list.net/images/avatar/m.png" />
            <div class="name">
              <span>Busy</span>
              <div style="line-height: 0; display: flex">
                <span class="fas fa-reply"></span
                ><span class="online-status away fa fa-cog"></span
                ><span style="flex: 1 1 0%"></span
                ><span
                  aria-label="Pin this tab"
                  class="pin fas fa-thumbtack"
                ></span
                ><span
                  aria-label="Close this tab"
                  class="fas fa-times leave"
                ></span>
              </div></div
          ></a>
          <a
            href="#"
            data-bs-touch="false"
            class="list-group-item list-group-item-action item-private"
            ><img src="https://static.f-list.net/images/avatar/m.png" />
            <div class="name">
              <span>Idle</span>
              <div style="line-height: 0; display: flex">
                <span class="fas fa-reply"></span
                ><span class="online-status away far fa-clock"></span
                ><span style="flex: 1 1 0%"></span
                ><span
                  aria-label="Pin this tab"
                  class="pin fas fa-thumbtack"
                ></span
                ><span
                  aria-label="Close this tab"
                  class="fas fa-times leave"
                ></span>
              </div></div
          ></a>
          <a
            href="#"
            data-bs-touch="false"
            class="list-group-item list-group-item-action item-private"
            ><img src="https://static.f-list.net/images/avatar/m.png" />
            <div class="name">
              <span>Away</span>
              <div style="line-height: 0; display: flex">
                <span class="fas fa-reply"></span
                ><span class="online-status away far fa-circle"></span
                ><span style="flex: 1 1 0%"></span
                ><span
                  aria-label="Pin this tab"
                  class="pin fas fa-thumbtack"
                ></span
                ><span
                  aria-label="Close this tab"
                  class="fas fa-times leave"
                ></span>
              </div></div
          ></a>
          <a
            href="#"
            data-bs-touch="false"
            class="list-group-item list-group-item-action item-private"
            ><img src="https://static.f-list.net/images/avatar/m.png" />
            <div class="name">
              <span>Do not disturb</span>
              <div style="line-height: 0; display: flex">
                <span class="fas fa-reply"></span
                ><span class="online-status dnd fa fa-minus-circle"></span
                ><span style="flex: 1 1 0%"></span
                ><span
                  aria-label="Pin this tab"
                  class="pin fas fa-thumbtack"
                ></span
                ><span
                  aria-label="Close this tab"
                  class="fas fa-times leave"
                ></span>
              </div></div
          ></a>
        </div>
      </div>

      <div>
        <h2>Users</h2>

        <h3>With icons</h3>
        <span class="user-view gender-none"
          ><!----><span
            class="user-gender fa fa-fw fa-genderless gender-none"
          ></span
          ><span class="user-status fa-fw far fa-user"></span
          ><!----><!---->None<!----></span
        >
        <span class="user-view gender-male"
          ><!----><span class="user-gender fa fa-fw fa-mars gender-male"></span
          ><span class="user-status fa-fw far fa-user"></span
          ><!----><!---->Male<!----></span
        >
        <span class="user-view gender-female"
          ><!----><span
            class="user-gender fa fa-fw fa-venus gender-female"
          ></span
          ><span class="user-status fa-fw far fa-user"></span
          ><!----><!---->Female<!----></span
        >
        <span class="user-view gender-shemale"
          ><!----><span
            class="user-gender fa fa-fw fa-mars-and-venus gender-shemale"
          ></span
          ><span class="user-status fa-fw far fa-user"></span
          ><!----><!---->Shemale<!----></span
        >
        <span class="user-view gender-herm"
          ><!----><span
            class="user-gender fa fa-fw fa-mercury gender-herm"
          ></span
          ><span class="user-status fa-fw far fa-user"></span
          ><!----><!---->Herm<!----></span
        >
        <span class="user-view gender-male-herm"
          ><!----><span
            class="user-gender fa fa-fw fa-mars-stroke-v gender-male-herm"
          ></span
          ><span class="user-status fa-fw far fa-user"></span
          ><!----><!---->Male-Herm<!----></span
        >
        <span class="user-view gender-cunt-boy"
          ><!----><span
            class="user-gender fa fa-fw fa-mars-stroke-h gender-cunt-boy"
          ></span
          ><span class="user-status fa-fw far fa-user"></span
          ><!----><!---->Cunt-boy<!----></span
        >
        <span class="user-view gender-transgender"
          ><!----><span
            class="user-gender fa fa-fw fa-transgender gender-transgender"
          ></span
          ><span class="user-status fa-fw far fa-user"></span
          ><!----><!---->Transgender<!----></span
        >

        <h3>With different statuses</h3>
        <span class="user-view gender-male"
          ><!----><span class="user-gender fa fa-fw fa-mars gender-male"></span
          ><span class="user-status fa-fw far fa-user"></span
          ><!----><!---->Online Male<!----></span
        >
        <span class="user-view gender-female"
          ><!----><span
            class="user-gender fa fa-fw fa-venus gender-female"
          ></span
          ><span class="user-status fa-fw fa fa-eye"></span
          ><!----><!---->Looking Female<!----></span
        >
        <span class="user-view gender-none"
          ><!----><span
            class="user-gender fa fa-fw fa-genderless gender-none"
          ></span
          ><span class="user-status fa-fw fa fa-minus-circle"></span
          ><!----><!---->DND None<!----></span
        >
        <span class="user-view gender-male"
          ><!----><span class="user-gender fa fa-fw fa-times gender-male"></span
          ><span class="user-status fa-fw fa fa-ban"></span
          ><!----><!---->Offline Male<!----></span
        >
        <span class="user-view gender-female"
          ><!----><span
            class="user-gender fa fa-fw fa-venus gender-female"
          ></span
          ><span class="user-status fa-fw far fa-circle"></span
          ><!----><!---->Away Female<!----></span
        >
        <span class="user-view gender-herm"
          ><!----><span
            class="user-gender fa fa-fw fa-mercury gender-herm"
          ></span
          ><span class="user-status fa-fw fa fa-cog"></span
          ><!----><!---->Busy Herm<!----></span
        >
        <span class="user-view gender-shemale"
          ><!----><span
            class="user-gender fa fa-fw fa-mars-and-venus gender-shemale"
          ></span
          ><span class="user-status fa-fw far fa-clock"></span
          ><!----><!---->Idle Shemale<!----></span
        >
        <span class="user-view gender-male-herm"
          ><!----><span
            class="user-gender fa fa-fw fa-mars-stroke-v gender-male-herm"
          ></span
          ><span class="user-status fa-fw fa fa-birthday-cake"></span
          ><!----><!---->Crown Male-Herm<!----></span
        >

        <h3>With bookmarks and ranks</h3>
        <span class="user-view gender-male user-bookmark"
          ><!----><span class="user-gender fa fa-fw fa-mars gender-male"></span
          ><span class="user-status fa-fw far fa-user"></span
          ><span class="user-rank far fa-gem"></span
          ><!---->Chat Op Bookmark<!----></span
        >
        <span class="user-view gender-female user-bookmark"
          ><!----><span
            class="user-gender fa fa-fw fa-venus gender-female"
          ></span
          ><span class="user-status fa-fw fa fa-eye"></span
          ><span class="user-rank fa fa-key"></span
          ><!---->Channel Owner Bookmark<!----></span
        >
        <span class="user-view gender-herm user-bookmark"
          ><!----><span
            class="user-gender fa fa-fw fa-mercury gender-herm"
          ></span
          ><span class="user-status fa-fw far fa-user"></span
          ><span class="user-rank fa fa-star"></span
          ><!---->Channel Op Bookmark<!----></span
        >

        <h3>With match scores and filtering</h3>
        <span class="user-view gender-none"
          ><!----><span
            class="user-gender fa fa-fw fa-genderless gender-none"
          ></span
          ><span class="user-status fa-fw far fa-user"></span
          ><!----><!---->None<span class="match-found perfect"
            >Perfect</span
          ></span
        >
        <span class="user-view gender-none"
          ><!----><span
            class="user-gender fa fa-fw fa-genderless gender-none"
          ></span
          ><span class="user-status fa-fw far fa-user"></span
          ><!----><!---->None<span class="match-found match">Great</span></span
        >
        <span class="user-view gender-none"
          ><!----><span
            class="user-gender fa fa-fw fa-genderless gender-none"
          ></span
          ><span class="user-status fa-fw far fa-user"></span
          ><!----><!---->None<span class="match-found weak-match"
            >Good</span
          ></span
        >
        <span class="user-view gender-none"
          ><!----><span
            class="user-gender fa fa-fw fa-genderless gender-none"
          ></span
          ><span class="user-status fa-fw far fa-user"></span
          ><!----><!---->None<span class="match-found weak-mismatch"
            >Maybe</span
          ></span
        >
        <span class="user-view gender-none"
          ><!----><span
            class="user-gender fa fa-fw fa-genderless gender-none"
          ></span
          ><span class="user-status fa-fw far fa-user"></span
          ><!----><!---->None<span class="match-found mismatch">No</span></span
        >
        <span class="user-view gender-none"
          ><!----><span
            class="user-gender fa fa-fw fa-genderless gender-none"
          ></span
          ><span class="user-status fa-fw far fa-user"></span
          ><span class="user-filter fas fa-filter"></span
          ><!---->Filtered None<!----></span
        >
      </div>
    </div>
    <div v-show="selectedTab === '1'">
      <h2>Messages</h2>

      <h3>Regular Messages</h3>
      <div class="message message-message">
        <span class="message-time">10:15</span>
        <span class="user-view gender-male">
          <span class="user-gender fa fa-fw fa-mars gender-male"></span>
          User1
        </span>
        <span class="message-post">: </span>
        <span
          >This is a regular message with <span class="redText">red</span>,
          <span class="blueText">blue</span>,
          <span class="whiteText">white</span>,
          <span class="yellowText">yellow</span>,
          <span class="pinkText">pink</span>,
          <span class="grayText">gray</span>,
          <span class="greenText">green</span>,
          <span class="orangeText">orange</span>,
          <span class="purpleText">purple</span>,
          <span class="blackText">black</span>,
          <span class="brownText">brown</span>, and
          <span class="cyanText">cyan</span> text.</span
        >
      </div>

      <div class="message message-message message-own">
        <span class="message-time">10:16</span>
        <span class="user-view gender-female">
          <span class="user-gender fa fa-fw fa-venus gender-female"></span>
          User2
        </span>
        <span class="message-post">: </span>
        <span>This is my own message.</span>
      </div>

      <h3>Action Messages</h3>
      <div class="message message-action">
        <span class="message-time">10:17</span>
        <i class="message-pre fas fa-star-of-life"></i>
        <span class="user-view gender-herm">
          <span class="user-gender fa fa-fw fa-mercury gender-herm"></span>
          User3
        </span>
        <span
          >performs an action with <span class="redText">red</span>,
          <span class="blueText">blue</span>,
          <span class="whiteText">white</span>,
          <span class="yellowText">yellow</span>,
          <span class="pinkText">pink</span>,
          <span class="grayText">gray</span>,
          <span class="greenText">green</span>,
          <span class="orangeText">orange</span>,
          <span class="purpleText">purple</span>,
          <span class="blackText">black</span>,
          <span class="brownText">brown</span>, and
          <span class="cyanText">cyan</span> text.</span
        >
      </div>

      <h3>Ad Messages</h3>
      <div class="message message-ad message-score match">
        <span class="message-time">10:18</span>
        <span class="user-view gender-shemale">
          <span
            class="user-gender fa fa-fw fa-mars-and-venus gender-shemale"
          ></span>
          User4
        </span>
        <span class="message-post">: </span>
        <span
          >This is an advertisement with a great match score and
          <span class="redText">red</span>, <span class="blueText">blue</span>,
          <span class="whiteText">white</span>,
          <span class="yellowText">yellow</span>,
          <span class="pinkText">pink</span>,
          <span class="grayText">gray</span>,
          <span class="greenText">green</span>,
          <span class="orangeText">orange</span>,
          <span class="purpleText">purple</span>,
          <span class="blackText">black</span>,
          <span class="brownText">brown</span>, and
          <span class="cyanText">cyan</span> text.</span
        >
      </div>

      <div class="message message-ad message-score weak-match">
        <span class="message-time">10:19</span>
        <span class="user-view gender-transgender">
          <span
            class="user-gender fa fa-fw fa-transgender gender-transgender"
          ></span>
          User5
        </span>
        <span class="message-post">: </span>
        <span>This is an advertisement with a good match score.</span>
      </div>

      <div class="message message-ad message-score weak-mismatch">
        <span class="message-time">10:20</span>
        <span class="user-view gender-male-herm">
          <span
            class="user-gender fa fa-fw fa-mars-stroke-v gender-male-herm"
          ></span>
          User6
        </span>
        <span class="message-post">: </span>
        <span>This is an advertisement with a maybe match score.</span>
      </div>

      <div class="message message-ad message-score mismatch">
        <span class="message-time">10:21</span>
        <span class="user-view gender-cunt-boy">
          <span
            class="user-gender fa fa-fw fa-mars-stroke-h gender-cunt-boy"
          ></span>
          User7
        </span>
        <span class="message-post">: </span>
        <span>This is an advertisement with a no match score.</span>
      </div>

      <div class="message message-ad filter-match">
        <span class="message-time">10:22</span>
        <span class="user-view gender-none">
          <span class="user-gender fa fa-fw fa-genderless gender-none"></span>
          User8
        </span>
        <span class="message-post">: </span>
        <span>This is an advertisement with a filter match.</span>
      </div>

      <h3>Event Messages</h3>
      <div class="message message-event">
        <span class="message-time">10:23</span>
        <span>User1 has joined the channel.</span>
      </div>

      <div class="message message-event">
        <span class="message-time">10:24</span>
        <span>User2 has left the channel.</span>
      </div>

      <h3>Warn Messages</h3>
      <div class="message message-warn">
        <span class="message-time">10:25</span>
        <span class="user-view gender-none">
          <span class="user-gender fa fa-fw fa-genderless gender-none"></span>
          System
        </span>
        <span class="message-post">: </span>
        <span
          >This is a warning message with <span class="redText">red</span>,
          <span class="blueText">blue</span>,
          <span class="whiteText">white</span>,
          <span class="yellowText">yellow</span>,
          <span class="pinkText">pink</span>,
          <span class="grayText">gray</span>,
          <span class="greenText">green</span>,
          <span class="orangeText">orange</span>,
          <span class="purpleText">purple</span>,
          <span class="blackText">black</span>,
          <span class="brownText">brown</span>, and
          <span class="cyanText">cyan</span> text.</span
        >
      </div>

      <div class="message message-warn">
        <span class="message-time">10:25</span>
        <span class="user-view gender-male">
          <span class="user-gender fa fa-fw fa-mars gender-male"></span>
          SystemMale
        </span>
        <span class="message-post">: </span>
        <span>This is a warning message from a Male character.</span>
      </div>

      <div class="message message-warn">
        <span class="message-time">10:25</span>
        <span class="user-view gender-female">
          <span class="user-gender fa fa-fw fa-venus gender-female"></span>
          SystemFemale
        </span>
        <span class="message-post">: </span>
        <span>This is a warning message from a Female character.</span>
      </div>

      <div class="message message-warn">
        <span class="message-time">10:25</span>
        <span class="user-view gender-shemale">
          <span
            class="user-gender fa fa-fw fa-mars-and-venus gender-shemale"
          ></span>
          SystemShemale
        </span>
        <span class="message-post">: </span>
        <span>This is a warning message from a Shemale character.</span>
      </div>

      <div class="message message-warn">
        <span class="message-time">10:25</span>
        <span class="user-view gender-herm">
          <span class="user-gender fa fa-fw fa-mercury gender-herm"></span>
          SystemHerm
        </span>
        <span class="message-post">: </span>
        <span>This is a warning message from a Herm character.</span>
      </div>

      <div class="message message-warn">
        <span class="message-time">10:25</span>
        <span class="user-view gender-male-herm">
          <span
            class="user-gender fa fa-fw fa-mars-stroke-v gender-male-herm"
          ></span>
          SystemMaleHerm
        </span>
        <span class="message-post">: </span>
        <span>This is a warning message from a Male-Herm character.</span>
      </div>

      <div class="message message-warn">
        <span class="message-time">10:25</span>
        <span class="user-view gender-cunt-boy">
          <span
            class="user-gender fa fa-fw fa-mars-stroke-h gender-cunt-boy"
          ></span>
          SystemCuntBoy
        </span>
        <span class="message-post">: </span>
        <span>This is a warning message from a Cunt-boy character.</span>
      </div>

      <div class="message message-warn">
        <span class="message-time">10:25</span>
        <span class="user-view gender-transgender">
          <span
            class="user-gender fa fa-fw fa-transgender gender-transgender"
          ></span>
          SystemTransgender
        </span>
        <span class="message-post">: </span>
        <span>This is a warning message from a Transgender character.</span>
      </div>

      <h3>Messages with Highlight</h3>
      <div class="message message-message message-highlight">
        <span class="message-time">10:26</span>
        <span class="user-view gender-female">
          <span class="user-gender fa fa-fw fa-venus gender-female"></span>
          User9
        </span>
        <span class="message-post">: </span>
        <span
          >This is a highlighted message with <span class="redText">red</span>,
          <span class="blueText">blue</span>,
          <span class="whiteText">white</span>,
          <span class="yellowText">yellow</span>,
          <span class="pinkText">pink</span>,
          <span class="grayText">gray</span>,
          <span class="greenText">green</span>,
          <span class="orangeText">orange</span>,
          <span class="purpleText">purple</span>,
          <span class="blackText">black</span>,
          <span class="brownText">brown</span>, and
          <span class="cyanText">cyan</span> text.</span
        >
      </div>

      <div class="message message-message message-highlight">
        <span class="message-time">10:26</span>
        <span class="user-view gender-none">
          <span class="user-gender fa fa-fw fa-genderless gender-none"></span>
          HighlightNone
        </span>
        <span class="message-post">: </span>
        <span>This is a highlighted message from a None gender character.</span>
      </div>

      <div class="message message-message message-highlight">
        <span class="message-time">10:26</span>
        <span class="user-view gender-male">
          <span class="user-gender fa fa-fw fa-mars gender-male"></span>
          HighlightMale
        </span>
        <span class="message-post">: </span>
        <span>This is a highlighted message from a Male gender character.</span>
      </div>

      <div class="message message-message message-highlight">
        <span class="message-time">10:26</span>
        <span class="user-view gender-female">
          <span class="user-gender fa fa-fw fa-venus gender-female"></span>
          HighlightFemale
        </span>
        <span class="message-post">: </span>
        <span
          >This is a highlighted message from a Female gender character.</span
        >
      </div>

      <div class="message message-message message-highlight">
        <span class="message-time">10:26</span>
        <span class="user-view gender-shemale">
          <span
            class="user-gender fa fa-fw fa-mars-and-venus gender-shemale"
          ></span>
          HighlightShemale
        </span>
        <span class="message-post">: </span>
        <span
          >This is a highlighted message from a Shemale gender character.</span
        >
      </div>

      <div class="message message-message message-highlight">
        <span class="message-time">10:26</span>
        <span class="user-view gender-herm">
          <span class="user-gender fa fa-fw fa-mercury gender-herm"></span>
          HighlightHerm
        </span>
        <span class="message-post">: </span>
        <span>This is a highlighted message from a Herm gender character.</span>
      </div>

      <div class="message message-message message-highlight">
        <span class="message-time">10:26</span>
        <span class="user-view gender-male-herm">
          <span
            class="user-gender fa fa-fw fa-mars-stroke-v gender-male-herm"
          ></span>
          HighlightMaleHerm
        </span>
        <span class="message-post">: </span>
        <span
          >This is a highlighted message from a Male-Herm gender
          character.</span
        >
      </div>

      <div class="message message-message message-highlight">
        <span class="message-time">10:26</span>
        <span class="user-view gender-cunt-boy">
          <span
            class="user-gender fa fa-fw fa-mars-stroke-h gender-cunt-boy"
          ></span>
          HighlightCuntBoy
        </span>
        <span class="message-post">: </span>
        <span
          >This is a highlighted message from a Cunt-boy gender character.</span
        >
      </div>

      <div class="message message-message message-highlight">
        <span class="message-time">10:26</span>
        <span class="user-view gender-transgender">
          <span
            class="user-gender fa fa-fw fa-transgender gender-transgender"
          ></span>
          HighlightTransgender
        </span>
        <span class="message-post">: </span>
        <span
          >This is a highlighted message from a Transgender gender
          character.</span
        >
      </div>

      <h3>Messages with Block Style</h3>
      <div class="message message-message message-block">
        <span class="message-time">10:27</span>
        <span class="user-view gender-male">
          <span class="user-gender fa fa-fw fa-mars gender-male"></span>
          User10
        </span>
        <span class="message-post">: </span>
        <span>This is a message with block style.</span>
      </div>
    </div>
    <div v-show="selectedTab === '2'">
      <h2>Modern UI Messages</h2>

      <h3>Ungrouped Messages with BBCode Colors and All Genders</h3>
      <div class="layout-modern">
        <div class="message message-message message-modern">
          <div class="message-avatar-spacer"></div>
          <div class="message-modern-inner">
            <div class="message-header">
              <span class="user-view gender-none">
                <span
                  class="user-gender fa fa-fw fa-genderless gender-none"
                ></span>
                <span class="user-status fa-fw far fa-user"></span>
                NoneUser
              </span>
              <span class="message-time">10:30</span>
            </div>
            <div class="message-content">
              <span
                >Testing <span class="redText">red</span>,
                <span class="blueText">blue</span>,
                <span class="whiteText">white</span>,
                <span class="yellowText">yellow</span>,
                <span class="pinkText">pink</span>,
                <span class="grayText">gray</span>,
                <span class="greenText">green</span>,
                <span class="orangeText">orange</span>,
                <span class="purpleText">purple</span>,
                <span class="blackText">black</span>,
                <span class="brownText">brown</span>, and
                <span class="cyanText">cyan</span> colors.</span
              >
            </div>
          </div>
        </div>

        <div class="message message-message message-modern message-own">
          <div class="message-avatar-spacer"></div>
          <div class="message-modern-inner">
            <div class="message-header">
              <span class="user-view gender-male">
                <span class="user-gender fa fa-fw fa-mars gender-male"></span>
                <span class="user-status fa-fw far fa-user"></span>
                MaleUser
              </span>
              <span class="message-time">10:31</span>
            </div>
            <div class="message-content">
              <span
                >Own message with <span class="redText">red</span>,
                <span class="blueText">blue</span>,
                <span class="whiteText">white</span>,
                <span class="yellowText">yellow</span>,
                <span class="pinkText">pink</span>,
                <span class="grayText">gray</span>,
                <span class="greenText">green</span>,
                <span class="orangeText">orange</span>,
                <span class="purpleText">purple</span>,
                <span class="blackText">black</span>,
                <span class="brownText">brown</span>, and
                <span class="cyanText">cyan</span> colors.</span
              >
            </div>
          </div>
        </div>

        <div class="message message-message message-modern message-highlight">
          <div class="message-avatar-spacer"></div>
          <div class="message-modern-inner">
            <div class="message-header">
              <span class="user-view gender-female">
                <span
                  class="user-gender fa fa-fw fa-venus gender-female"
                ></span>
                <span class="user-status fa-fw far fa-user"></span>
                FemaleUser
              </span>
              <span class="message-time">10:32</span>
            </div>
            <div class="message-content">
              <span
                >Highlighted message with <span class="redText">red</span>,
                <span class="blueText">blue</span>,
                <span class="whiteText">white</span>,
                <span class="yellowText">yellow</span>,
                <span class="pinkText">pink</span>,
                <span class="grayText">gray</span>,
                <span class="greenText">green</span>,
                <span class="orangeText">orange</span>,
                <span class="purpleText">purple</span>,
                <span class="blackText">black</span>,
                <span class="brownText">brown</span>, and
                <span class="cyanText">cyan</span> colors.</span
              >
            </div>
          </div>
        </div>

        <div class="message message-warn message-modern">
          <div class="message-avatar-spacer"></div>
          <div class="message-modern-inner">
            <div class="message-header">
              <span class="user-view gender-shemale">
                <span
                  class="user-gender fa fa-fw fa-mars-and-venus gender-shemale"
                ></span>
                <span class="user-status fa-fw far fa-user"></span>
                ShemaleUser
              </span>
              <span class="message-time">10:33</span>
            </div>
            <div class="message-content">
              <i class="message-pre fa fa-fw fa-triangle-exclamation"></i>
              <span
                >Warning message with <span class="redText">red</span>,
                <span class="blueText">blue</span>,
                <span class="whiteText">white</span>,
                <span class="yellowText">yellow</span>,
                <span class="pinkText">pink</span>,
                <span class="grayText">gray</span>,
                <span class="greenText">green</span>,
                <span class="orangeText">orange</span>,
                <span class="purpleText">purple</span>,
                <span class="blackText">black</span>,
                <span class="brownText">brown</span>, and
                <span class="cyanText">cyan</span> colors.</span
              >
            </div>
          </div>
        </div>
      </div>

      <h3>Grouped Messages by Same User</h3>
      <div class="layout-modern">
        <div class="message message-message message-modern">
          <div class="message-avatar-spacer"></div>
          <div class="message-modern-inner">
            <div class="message-header">
              <span class="user-view gender-herm">
                <span
                  class="user-gender fa fa-fw fa-mercury gender-herm"
                ></span>
                <span class="user-status fa-fw far fa-user"></span>
                HermUser
              </span>
              <span class="message-time">10:34</span>
            </div>
            <div class="message-content">
              <span
                >Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna
                aliqua.</span
              >
            </div>
          </div>
        </div>

        <div class="message message-message message-modern message-highlight">
          <div class="message-avatar-spacer">
            <span class="message-time">10:35</span>
          </div>
          <div class="message-modern-inner">
            <div class="message-content">
              <span
                >Ut enim ad minim veniam, quis nostrud exercitation ullamco
                laboris nisi ut aliquip ex ea commodo consequat.</span
              >
            </div>
          </div>
        </div>

        <div class="message message-warn message-modern">
          <div class="message-avatar-spacer">
            <span class="message-time">10:36</span>
          </div>
          <div class="message-modern-inner">
            <div class="message-content">
              <i class="message-pre fa fa-fw fa-triangle-exclamation"></i>
              <span
                >Duis aute irure dolor in reprehenderit in voluptate velit esse
                cillum dolore eu fugiat nulla pariatur.</span
              >
            </div>
          </div>
        </div>
      </div>
      <h3>Grouped Messages by You</h3>
      <div class="layout-modern">
        <div class="message message-message message-modern message-own">
          <div class="message-avatar-spacer"></div>
          <div class="message-modern-inner">
            <div class="message-header">
              <span class="user-view gender-herm">
                <span
                  class="user-gender fa fa-fw fa-mercury gender-none"
                ></span>
                <span class="user-status fa-fw far fa-user"></span>
                You
              </span>
              <span class="message-time">10:34</span>
            </div>
            <div class="message-content">
              <span
                >Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna
                aliqua.</span
              >
            </div>
          </div>
        </div>

        <div class="message message-warn message-modern message-own">
          <div class="message-avatar-spacer">
            <span class="message-time">10:36</span>
          </div>
          <div class="message-modern-inner">
            <div class="message-content">
              <i class="message-pre fa fa-fw fa-triangle-exclamation"></i>
              <span
                >Duis aute irure dolor in reprehenderit in voluptate velit esse
                cillum dolore eu fugiat nulla pariatur.</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </modal>
</template>

<script lang="ts">
  import { Component } from '@f-list/vue-ts';
  import CustomDialog from '../components/custom_dialog';
  import Modal from '../components/Modal.vue';
  import Tabs from '../components/tabs';
  import l from './localize';

  @Component({
    components: { modal: Modal, tabs: Tabs }
  })
  export default class UITest extends CustomDialog {
    selectedTab = '0';
    l = l;
  }
</script>
