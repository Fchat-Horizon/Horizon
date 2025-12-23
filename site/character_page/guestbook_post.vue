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
  import { computed, defineComponent, onBeforeMount, PropType, ref } from 'vue';
  import Vue from 'vue';
  import CharacterLink from '../../components/character_link.vue';
  import DateDisplay from '../../components/date_display.vue';
  import * as Utils from '../utils';
  import { methods } from './data_store';
  import { Character, GuestbookPost } from './interfaces';
  import { StandardBBCodeParser } from '../../bbcode/standard';
  import { BBCodeView } from '../../bbcode/view';

  const standardParser = new StandardBBCodeParser();

  export default defineComponent({
    name: 'GuestbookPostView',
    components: {
      'date-display': DateDisplay,
      'character-link': CharacterLink,
      bbcode: BBCodeView(standardParser)
    },
    props: {
      character: {
        type: Object as PropType<Character>,
        required: true
      },
      post: {
        type: Object as PropType<GuestbookPost>,
        required: true
      },
      canEdit: {
        type: Boolean,
        required: true
      }
    },
    emits: ['reload'],
    setup(props, { emit }) {
      const replying = ref(false);
      const replyBox = ref(false);
      const replyMessage = ref(props.post.reply);
      const approving = ref(false);
      const deleting = ref(false);

      const avatarUrl = computed(() =>
        Utils.avatarURL(props.post.character.name)
      );

      onBeforeMount(() => {
        standardParser.inlines = props.character.character.inlines;

        // console.log('mounted');
      });

      const deletePost = async () => {
        try {
          deleting.value = true;
          await methods.guestbookPostDelete(
            props.character.character.id,
            props.post.id
          );
          Vue.set(props.post, 'deleted', true);
          emit('reload');
        } catch (e) {
          Utils.ajaxError(e, 'Unable to delete guestbook post.');
        } finally {
          deleting.value = false;
        }
      };

      const approve = async () => {
        try {
          approving.value = true;
          await methods.guestbookPostApprove(
            props.character.character.id,
            props.post.id,
            !props.post.approved
          );
          props.post.approved = !props.post.approved;
        } catch (e) {
          Utils.ajaxError(e, 'Unable to change post approval.');
        } finally {
          approving.value = false;
        }
      };

      const postReply = async () => {
        try {
          replying.value = true;
          await methods.guestbookPostReply(
            props.character.character.id,
            props.post.id,
            replyMessage.value
          );
          props.post.reply = replyMessage.value;
          props.post.repliedAt = Date.now() / 1000;
          replyBox.value = false;
        } catch (e) {
          Utils.ajaxError(e, 'Unable to post guestbook reply.');
        } finally {
          replying.value = false;
        }
      };

      return {
        replying,
        replyBox,
        replyMessage,
        approving,
        deleting,
        avatarUrl,
        deletePost,
        approve,
        postReply
      };
    }
  });
</script>
