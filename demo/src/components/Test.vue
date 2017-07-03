<template>
  <div class="test">
    <li>
      <router-link :to="{ name: 'admin' }">Test admin access</router-link>
    </li>
    <li>
      <router-link :to="{ name: 'account' }">Test account access</router-link>
    </li>
    <li>
      <router-link :to="{ name: 'login' }">Test login access</router-link>
    </li>
  </div>
</template>

<script>
export default {

};
</script>
