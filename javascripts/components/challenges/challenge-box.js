"use strict";

Vue.component("challenge-box", {
  props: {
    name: String,
    isUnlocked: false,
    isRunning: false,
    isCompleted: false,
    overrideLabel: {
      type: String,
      default: "",
    }
  },
  data() {
    return {
      isEC: false,
    };
  },
  computed: {
    update() {
      this.isEC = this.name.startsWith("EC");
    },
    buttonClassObject() {
      const classObject = {
        "o-challenge-btn": true
      };
      if (this.isRunning) {
        classObject["o-challenge-btn--running"] = true;
      } else if (this.isCompleted && ((this.isUnlocked && !this.isEC) || (!this.isUnlocked && this.isEC))) {
        classObject["o-challenge-btn--completed"] = true;
      } else if (this.isCompleted && this.isUnlocked && this.isEC) {
        classObject["o-challenge-btn--redo"] = true;
      } else if (this.isUnlocked) {
        classObject["o-challenge-btn--unlocked"] = true;
      } else {
        classObject["o-challenge-btn--locked"] = true;
      }
      // ECs can be not unlocked and also not locked, because they're fully completed or running,
      // but in that case you can't enter them (or in the "running" case, re-enter them) and so
      // it's important to give them a property that disables cursor on hover.
      classObject["o-challenge-btn--unenterable"] = !this.isUnlocked || (this.isEC && this.isRunning);
      return classObject;
    },
    buttonText() {
      if (this.overrideLabel.length) return this.overrideLabel;
      if (this.isRunning) return "Running";
      if (this.isCompleted) {
        if (this.isEC && this.isUnlocked) return "Redo";
        return "Completed";
      }
      if (this.isUnlocked) return "Start";
      return "Locked";
    }
  },
  template:
    `<div class="c-challenge-box l-challenge-box">
      <hint-text type="challenges" class="l-hint-text--challenge">{{name}}</hint-text>
      <slot name="top" />
      <div class="l-challenge-box__fill" />
      <button
        :class="buttonClassObject"
        @click="$emit('start')"
      >{{buttonText}}</button>
      <slot name="bottom" />
    </div>`
});