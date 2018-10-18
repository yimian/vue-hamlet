<template>
  <div class="test">
    <ul>
      <li>
        <router-link :to="{ name: 'admin' }">
          Test admin access
        </router-link>
      </li>
      <li>
        <router-link :to="{ name: 'account' }">
          Test account access
        </router-link>
      </li>
      <li>
        <router-link :to="{ name: 'login' }">
          Test login access
        </router-link>
      </li>
      <li>
        <router-link :to="{ name: 'changePassword' }">
          Test changePassword access
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script>
export default {

};
</script>

<style scoped>
.test > ul > li {
  list-style: none;
}
</style>
