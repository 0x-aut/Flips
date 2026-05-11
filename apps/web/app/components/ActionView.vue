<script setup lang="ts">
import { 
  FolderOpen, Headphones,
  ArrowRightLeft, Captions,
  Languages
} from "@lucide/vue";
// import { ActionMenu } from "../../shared/types/ActionTypes"; // A better way for import is necessary

// We will use useState here to get the actionview to be different when the buttons are clicked.
const actionInFocus = useState<ActionMenu>("actionview", () => ActionMenu.MEDIA_ASSETS);


function changeActionInFocus(actionType: ActionMenu) {
  actionInFocus.value = actionType;
}

console.log(actionInFocus.value);

</script>

<template>
  <section class="flex bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg h-full w-full">
    <div class="flex flex-col gap-y-0.5 items-center justify-start border border-l-0 border-t-0 border-b-0 border-r-[#2e2e2e] h-full w-1/7 py-1">
      <button 
        @click="changeActionInFocus(ActionMenu.MEDIA_ASSETS)" 
        :class="[
          'flex items-center justify-center p-1.5 rounded-md border',
          actionInFocus === ActionMenu.MEDIA_ASSETS
            ? 'border-[#2567EC] bg-[#2567EC]/10'
            : 'border-transparent'
        ]" 
        title="Media" name="Media"
      >
        <FolderOpen :size="13" color="#FFFFFF" :stroke-width="1.5" />
      </button>
      <button 
        @click="changeActionInFocus(ActionMenu.SOUNDS)" 
        :class="[
          'flex items-center justify-center p-1.5 rounded-md border',
          actionInFocus === ActionMenu.SOUNDS
            ? 'border-[#2567EC] bg-[#2567EC]/10'
            : 'border-transparent'
        ]"
        title="Sounds" name="Sounds"
      >
        <Headphones :size="13" color="#FFFFFF" :stroke-width="1.5" />
      </button>
      <button 
        @click="changeActionInFocus(ActionMenu.TRANSITIONS)" 
        :class="[
          'flex items-center justify-center p-1.5 rounded-md border',
          actionInFocus === ActionMenu.TRANSITIONS
            ? 'border-[#2567EC] bg-[#2567EC]/10'
            : 'border-transparent'
        ]"
        title="Transitions" name="Transitions"
      >
        <ArrowRightLeft :size="13" color="#FFFFFF" :stroke-width="1.5" />
      </button>
      <button 
        :class="[
          'flex items-center justify-center p-1.5 rounded-md border',
          actionInFocus === ActionMenu.CAPTIONS
            ? 'border-[#2567EC] bg-[#2567EC]/10'
            : 'border-transparent'
        ]" 
        title="Captions" name="Captions"
        @click="changeActionInFocus(ActionMenu.CAPTIONS)" 
      >
        <Captions :size="13" color="#FFFFFF" :stroke-width="1.5" />
      </button>
      <button 
        @click="changeActionInFocus(ActionMenu.TRANSLATE)" 
        :class="[
          'flex items-center justify-center p-1.5 rounded-md border',
          actionInFocus === ActionMenu.TRANSLATE
            ? 'border-[#2567EC] bg-[#2567EC]/10'
            : 'border-transparent'
        ]"
        title="Translate" name="Translate"
      >
        <Languages :size="13" color="#FFFFFF" :stroke-width="1.5" />
      </button>
    </div>
    <!-- Assets section, conditional via assets -->
    <section class="w-6/7 h-full">
      <ActionsCaptions v-if="actionInFocus === ActionMenu.CAPTIONS" />
      <ActionsAssets v-if="actionInFocus === ActionMenu.MEDIA_ASSETS" />
      <ActionsSounds v-if="actionInFocus === ActionMenu.SOUNDS" />
      <ActionsTransitions v-if="actionInFocus === ActionMenu.TRANSITIONS" />
      <!-- <ActionsCaptions v-if="actionInFocus == ActionMenu.CAPTIONS" /> -->
    </section>
  </section>
</template>