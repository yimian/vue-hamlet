<template>
  <div class="account">
    <ul>
      <li>Username: {{ user.username }}</li>
      <li>Role: {{ user.role }}</li>
    </ul>
  </div>
</template>

<script>
export default {
  computed: {
    user() {
      return this.$auth.user();
    },
  },
};
</script>

<style scoped>
  .account > ul > li {
    list-style: none;
  }
</style>
