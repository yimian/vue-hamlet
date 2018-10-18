<template>
  <div class="account">
    <ul>
      <li>Username: {{ user.username }}</li>
      <li>Role: {{ user.role }}</li>
    </ul>
    <form @submit.prevent="changePassword">
      <div class="block">
        <label for="current_password">current_password: </label>
        <input
          name="current_password"
          type="password"
          v-model="form.current_password">
      </div>
      <div class="block">
        <label for="password">password: </label>
        <input
          name="password"
          type="password"
          v-model="form.password">
      </div>
      <div class="block">
        <label for="confirm_password">confirm_password: </label>
        <input
          name="confirm_password"
          type="password"
          v-model="form.confirm_password">
      </div>
      <div class="block center">
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        current_password: '',
        password: '',
        confirm_password: '',
      },
    };
  },
  computed: {
    user() {
      const user = this.$auth.user();
      this.form.current_password = user.username === 'admin' ? 'admin' : 'test';
      return user;
    },
  },
  methods: {
    changePassword() {
      this.$auth.changePassword(this.form).then(() => {
        this.$router.push({ name: 'account' });
      }, (res) => {
        console.log('>>>> ', JSON.stringify(res));
      });
    },
  },
};
</script>

<style scoped>
.account > ul > li {
  list-style: none;
}

.block {
  width: 600px;
  display: block;
  margin: 10px auto;
}

label {
  display: inline-block;
  width: 200px;
  text-align: right;
}

.center {
  text-align: center;
}
</style>
