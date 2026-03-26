<template>
  <div class="guestbook-post" :id="'guestbook-post-' + post.id">
    <div class="guestbook-contents" :class="{ deleted: post.deleted }">
      <div style="display: flex; align-items: center">
        <div class="guestbook-avatar">
          <character-link :character="post.character">
            <img :src="avatarUrl" class="character-avatar icon" />
          </character-link>
        </div>
        <div style="flex: 1; margin-left: 10px">
          <span v-show="post.private" class="post-private">*</span>
          <span v-show="!post.approved" class="post-unapproved">
            (unapproved)</span
          >

          <span class="guestbook-timestamp">
            <character-link :character="post.character"></character-link> posted
            <date-display :time="post.postedAt"></date-display>
          </span>
          <button
            class="btn btn-secondary"
            v-show="canEdit"
            @click="approve"
            :disabled="approving"
            style="margin-left: 10px"
          >
            {{ post.approved ? 'Unapprove' : 'Approve' }}
          </button>
        </div>
        <!-- TODO proper permission handling -->
        <button
          class="btn btn-danger"
          v-show="!post.deleted && canEdit"
          @click="deletePost"
          :disabled="deleting"
        >
          Delete
        </button>
      </div>
      <div class="row">
        <div class="col-12">
          <bbcode
            class="bbcode guestbook-message"
            :text="post.message"
          ></bbcode>
          <div v-if="post.reply && !replyBox" class="guestbook-reply">
            <date-display
              v-if="post.repliedAt"
              :time="post.repliedAt"
            ></date-display>
            <bbcode class="reply-message" :text="post.reply"></bbcode>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-12">
          <a
            v-show="canEdit && !replyBox"
            class="reply-link"
            @click="replyBox = !replyBox"
          >
            {{ post.reply ? 'Edit Reply' : 'Reply' }}
          </a>
          <template v-if="replyBox">
            <bbcode-editor
              v-model="replyMessage"
              :maxlength="5000"
              classes="form-control"
            ></bbcode-editor>
            <button
              class="btn btn-success"
              @click="postReply"
              :disabled="replying"
            >
              Reply
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import CharacterLink from '../../components/character_link.vue';
  import DateDisplay from '../../components/date_display.vue';
  import * as Utils from '../utils';
  import { methods } from './data_store';
  import { Character, GuestbookPost } from './interfaces';
  import { StandardBBCodeParser } from '../../bbcode/standard';
  import { BBCodeView } from '../../bbcode/view';

  const standardParser = new StandardBBCodeParser();

  export default Vue.extend({
    components: {
      'date-display': DateDisplay,
      'character-link': CharacterLink,
      bbcode: BBCodeView(standardParser)
    },
    props: {
      character: { required: true as const },
      post: { required: true as const },
      canEdit: { required: true as const }
    },
    data() {
      return {
        replying: false,
        replyBox: false,
        replyMessage: (this as any).post.reply,
        approving: false,
        deleting: false
      };
    },
    computed: {
      avatarUrl(): string {
        return Utils.avatarURL((this as any).post.character.name);
      }
    },
    beforeMount(): void {
      standardParser.inlines = (this as any).character.character.inlines;

      // console.log('mounted');
    },
    methods: {
      async deletePost(): Promise<void> {
        try {
          this.deleting = true;
          await methods.guestbookPostDelete(
            (this as any).character.character.id,
            (this as any).post.id
          );
          Vue.set((this as any).post, 'deleted', true);
          this.$emit('reload');
        } catch (e) {
          Utils.ajaxError(e, 'Unable to delete guestbook post.');
        } finally {
          this.deleting = false;
        }
      },
      async approve(): Promise<void> {
        try {
          this.approving = true;
          await methods.guestbookPostApprove(
            (this as any).character.character.id,
            (this as any).post.id,
            !(this as any).post.approved
          );
          (this as any).post.approved = !(this as any).post.approved;
        } catch (e) {
          Utils.ajaxError(e, 'Unable to change post approval.');
        } finally {
          this.approving = false;
        }
      },
      async postReply(): Promise<void> {
        try {
          this.replying = true;
          await methods.guestbookPostReply(
            (this as any).character.character.id,
            (this as any).post.id,
            this.replyMessage
          );
          (this as any).post.reply = this.replyMessage;
          (this as any).post.repliedAt = Date.now() / 1000;
          this.replyBox = false;
        } catch (e) {
          Utils.ajaxError(e, 'Unable to post guestbook reply.');
        } finally {
          this.replying = false;
        }
      }
    }
  });
</script>
