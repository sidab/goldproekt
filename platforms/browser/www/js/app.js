var $$ = Dom7;

var app = new Framework7({
    root: '#app',
    name: 'Голд Проект',
    theme: 'ios',
    version: 2.0,
    routes: routes,
    backend: 'https://goldproekt.com',
    dialog: {
        buttonOk: 'Ок',
        buttonCancel: 'Отмена'
    },
    touch: {
        mdTouchRipple: false,
        tapHold: false,
        disableContextMenu: true,
        activeState: false,
        fastClicks: true
    },
    view: {
        animate: false,
        iosDynamicNavbar: false,
        //iosPageLoadDelay: 100,
        //mdPageLoadDelay: 100,
        stackPages: true
    },
    lazy: {
        threshold: 1500
    },
    photoBrowser: {
        backLinkText: 'Закрыть',
        navbarOfText: 'из'
    },
    cachedImages: [],
    toCacheImages: [],
    methods: {
        getFullLink: function (path) {

            var url = app.params.backend + '/storage/app/media' + path;

            var index = app.params.cachedImages.findIndex(image => image.src == url);

            if (index !== -1) {

                url = app.params.cachedImages[index].url;

            } else {

                app.params.toCacheImages.push(url);

            }

            return url;

        },
        priceFormat: function(price) {

            if (price >= 1000000) {

                return (price / 1000000).toFixed(3) +' млн.';

            } else {

                return price;

            }

        },
        checkVersion: function () {

          var app = this;

          app.request({
              url: encodeURI(app.params.backend + '/api'),
              cache: false,
              dataType: 'json',
              success: function(response) {

                  var appVersion = response.appVersion;

                  if (appVersion > app.params.version) {

                      app.dialog.alert('Вышла новая версия приложения, обновитесь пожалуйста.', function () {

                          if (app.device.ios) {

                              var updateLink = response.updateLink.ios;

                              window.open(updateLink, '_system');

                          } else {

                              var updateLink = response.updateLink.android;

                              window.open(updateLink, '_system');

                          }

                      });

                  }

                  var projectsCache = response.cacheVersion.projects;

                  if (projectsCache > Number(localStorage.projectsCache)) {

                      localStorage.removeItem('projects');

                      location.reload();

                  }

                  localStorage.projectsCache = projectsCache;

                  var articlesCache = response.cacheVersion.articles;

                  if (articlesCache > Number(localStorage.articlesCache)) {

                      localStorage.removeItem('articles');

                      location.reload();

                  }

                  localStorage.articlesCache = articlesCache;

                  var buildingProcessCache = response.cacheVersion.buildingProcess;

                  if (buildingProcessCache > Number(localStorage.buildingProcessCache)) {

                      localStorage.removeItem('buildingProcess');

                      location.reload();

                  }

                  localStorage.buildingProcessCache = buildingProcessCache;

              }
          });

        },
        cacheImages: function () {

          var app = this;
          var images = app.params.toCacheImages.slice(0, 5);

          if (images.length == 0 ) {

              return;

          }

          var success = function (blob, image) {

              var url = URL.createObjectURL(blob)

              app.params.cachedImages.push({
                  url: url,
                  src: image
              });

              var length = app.params.toCacheImages.length - 1;
              var index = app.params.toCacheImages.indexOf(image);

              app.params.toCacheImages.splice(index, 1);

          };

          var check = function (image) {

              localforage.getItem(image).then(function(value) {

                  if (value !== null) {

                      success(value, image);

                  } else {

                      app.request({
                          url: encodeURI(image),
                          xhrFields: {
                              responseType: 'blob'
                          },
                          success: function (response) {

                              localforage.setItem(image, response);

                              success(response, image);

                          }
                      });

                  }

              });

          };

          for (var i = 0; i < images.length; i++) {

              var image = images[i];

              check(image);

          }

        },
        backButton: function (closeApp = true) {

            if (closeApp) {

                if (app.views.current.router.url === '/projects' || app.views.current.router.url === '/beton' || app.views.current.router.url === '/building-process' || app.views.current.router.url === '/articles' || app.views.current.router.url === '/contacts') {

                    app.dialog.confirm('Вы уверены что хотите закрыть приложение?', function () {

                        navigator.app.exitApp();

                    });

                    return false;

                }

            }

            if ($$('.popover.modal-in').length > 0) {

                var popover;

                if ($$('.popover.modal-in').length > 1) {

                    popover = app.popover.get($$('.popover.modal-in:last-child'));

                } else {

                    popover = app.popover.get($$('.popover.modal-in'));

                }

                popover.close();

                return false;

            }

            if ($$('.popup.modal-in').length > 0) {

                var popup;

                if ($$('.popup.modal-in').length > 1) {

                    popup = app.popup.get($$('.popup.modal-in:last-child'));

                } else {

                    popup = app.popup.get($$('.popup.modal-in'));

                }

                popup.close();

                return false;

            }

            app.views.current.router.back();

        }
    },
    on: {
        init: function () {

            var app = this;

            app.methods.checkVersion();

            localforage.iterate(function(value, key, iterationNumber) {

                if (key.indexOf('http') !== -1) {

                    var url = URL.createObjectURL(value)

                    app.params.cachedImages.push({
                        url: url,
                        src: key
                    });

                }

            }).then(function() {

                app.emit('images:ready');

            });

            setInterval(function () {

                if (lazyLoadInerval) {

                    app.methods.cacheImages();

                }

            }, 5000);

        }
    }
}).init();

app.request.setup({
    beforeSend: function(xhr) {

        lazyLoadInerval = false;

    },
    complete: function(xhr) {

        lazyLoadInerval = true;

        console.log(xhr);

    },
    error: function () {

    }
});

app.on('images:ready', function () {

    app.views.create('#view-projects', {
        url: '/projects',
        main: true
    });

    app.views.create('#view-beton', {
        url: '/beton'
    });

    app.views.create('#view-building-process', {
        url: '/building-process'
    });

    app.views.create('#view-articles', {
        url: '/articles'
    });

    app.views.create('#view-contacts', {
        url: '/contacts'
    });

});
$$(document).on('deviceready', function () {

    setTimeout(function () {

        navigator.splashscreen.hide();

    }, 1000);

    lazyLoadInerval = true;

    setInterval(function () {

        if (lazyLoadInerval) {

            app.lazy.load('.lazy');

        }

    }, 1000);

    $$(document).on('backbutton', function (event) {

        app.methods.backButton();

    });

    $$(document).on('tab:show', function () {

        var first = true;

        $$(document).off('click', '.toolbar-menu .tab-link-active').on('click', '.toolbar-menu .tab-link-active', function (event) {

            if (!first) {

                app.methods.backButton(false);

            }

            first = false;

        });

    });

    $$(document).trigger('tab:show');

    $$(document).on('swipeback:beforechange', function () {

        app.methods.showToolbar();

    });

});