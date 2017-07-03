<template>
  <div>
    <h1>Login</h1>
    <label for="">Users: </label>
    <select v-model="selectedUser">
      <option v-for="user in users"
        :key="user.username"
        :value="user.username">
        {{ user.username }}
      </option>
    </select>
    <form v-on:submit.prevent="login">
      <label for="">Username: </label>
      <input type="text" v-model="loginUser.username">
      <br>
      <label for="">Password: </label>
      <input type="password" v-model="loginUser.password">
      <br>
      <button type="submit">Login</button>
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
    watch: {
      selectedUser(n) {
        const user = this.users.find(item => item.username === n);
        this.loginUser.username = user.username;
        this.loginUser.password = user.password;
      },
    },
    methods: {
      login() {
        this.$auth.login(this.loginUser).then(() => {
          this.$router.push({ name: 'index' });
        }, (res) => {
          console.log('>>>> ', JSON.stringify(res));
        });
      },
    },
  };
</script>
