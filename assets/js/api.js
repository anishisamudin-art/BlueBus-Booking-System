const api = (() => {
  // ---------- ROUTES ----------
  async function getRoutes() {
    return JSON.parse(localStorage.getItem("routes") || "[]");
  }

  async function addRoute(route) {
    const routes = await getRoutes();
    routes.push(route);
    localStorage.setItem("routes", JSON.stringify(routes));
  }

  async function deleteRoute(routeId) {
    let routes = await getRoutes();
    routes = routes.filter(r => r.id !== routeId);
    localStorage.setItem("routes", JSON.stringify(routes));
  }

  async function incrementBooking(routeId) {
    const routes = await getRoutes();
    const route = routes.find(r => r.id === routeId);
    if (route) {
      route.booked = (route.booked || 0) + 1;
      localStorage.setItem("routes", JSON.stringify(routes));
    }
  }

  // ---------- BOOKINGS ----------
  async function getBookings() {
    return JSON.parse(localStorage.getItem("bookings") || "[]");
  }

  async function addBooking(booking) {
    const bookings = await getBookings();
    bookings.push(booking);
    localStorage.setItem("bookings", JSON.stringify(bookings));
  }

  // ---------- USERS ----------
  async function getUsers() {
    return JSON.parse(localStorage.getItem("users") || "[]");
  }

  async function addUser(user) {
    const users = await getUsers();
    users.push(user);
    localStorage.setItem("users", JSON.stringify(users));
  }

  return {
    getRoutes,
    addRoute,
    deleteRoute,
    incrementBooking,
    getBookings,
    addBooking,
    getUsers,
    addUser
  };
})();