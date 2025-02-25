// ALERT: YIFFBOT FUNCTIONALITY IS ON THE CHOPPING BLOCK!
// **     Yiffbot was banned from F-List, and as such, most
//        of it's functionality no longer remains. Given that,  
//        features related to it are SUBJECT FOR DELETION!
//        Sowwwy...

// * added note, for anyone seeing this. If you're willing
// *  to reimpliment
// import _ from 'lodash';
// import { EventBus } from '../chat/preview/event-bus';
// import { Message } from '../chat/common';
// import core from '../chat/core';
// import Vue from 'vue';

// export function initYiffbot4000Integration() {
//   EventBus.$on('private-message', ({ message }: { message: Message }) => {
//     if (message.sender.name === 'YiffBot 4000') {
//       const match = message.text.match(/\[spoiler](.*?FChatRisingBotManifest.*?)\[\/spoiler]/i);

//       if (match && match[1]) {
//         try {
//           const manifest = JSON.parse(match[1]);

//           if (manifest.type === 'FChatRisingBotManifest' && manifest.version >= 1) {
//             const char = core.characters.get('YiffBot 4000');

//             Vue.set(char.overrides, 'avatarUrl', manifest.avatarUrl);
//             Vue.set(char.overrides, 'gender', _.get(manifest, 'assistant.gender'));
//           }
//         } catch (err) {
//           console.error('FChatRisingBotManifest.error', err);
//         }
//       }
//     }
//   });
// }
