<template>
  <div class="menu">
    <div class="menu__head">
      <div class="menu__logo">
        <img :src="require('@/assets/img/logo.png')" alt="" />
      </div>
      <div class="menu__icon">
        <svg class="svg-icon">
          <use xlink:href="#i-double-alt-arrow"></use>
        </svg>
      </div>
    </div>
    <div class="menu__body">
      <router-link to="/Dashboard" class="menu__link" exact>
        <div class="menu__link-text">Дашбоард</div>
      </router-link>
      <router-link to="/tasks" class="menu__link">
        <div class="menu__link-text">Задачи</div>
      </router-link>
      <router-link to="/Acts" class="menu__link">
        <div class="menu__link-text">Акты</div>
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: "Menu",
};
</script>
