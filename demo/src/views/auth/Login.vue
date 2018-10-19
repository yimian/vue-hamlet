<template>
  <div>
    <h1>Login</h1>
    <div class="block">
      <label for="">Users: </label>
      <select v-model="selectedUser">
        <option v-for="user in users"
          :key="user.username"
          :value="user.username">
          {{ user.username }}
        </option>
      </select>
    </div>
    <form @submit.prevent = "login">
      <div class="block">
        <label for="">Username: </label>
        <input type="text" v-model="loginUser.username">
      </div>
      <div class="block">
        <label for="">Password: </label>
        <input type="password" v-model="loginUser.password">
      </div>
      <div class="block center">
        <button type="submit">Login</button>
        <button type="reset">Reset</button>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedUser: 'admin',
      users: [
        { username: 'admin', password: 'admin' },
        { username: 'test', password: 'test' },
      ],
      loginUser: {
        username: 'admin',
        password: 'admin',
      },
    };
  },
  beforeRouteEnter(to, from, next) {
    console.log('>>>>> route', to, from);
    next((vm) => {
      if (vm.$auth.ready()) {
        vm.$router.push({ name: 'forbidden' });
      }
    });
  },
  watch: {
    selectedUser(n) {
      const user = this.users.find(item => item.username === n);
      this.loginUser = Object.assign({}, user);
    },
  },
  methods: {
    login() {
      this.$auth.login(this.loginUser).then(() => {
        this.$router.push({ name: 'account' });
      }, (res) => {
        console.log('>>>> ', JSON.stringify(res));
      });
    },
  },
};
</script>

<style scoped>
.block {
  width: 600px;
  display: block;
  margin: 10px auto;
}

.block select,input {
  width: 150px;
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
