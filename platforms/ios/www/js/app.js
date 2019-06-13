var $$ = Dom7;

var app = new Framework7({
    root: '#app',
    name: 'Голд Проект',
    theme: 'auto',
    version: 1.3,
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
        mdSwipeBack: true,
        animate: false,
        iosDynamicNavbar: false,
        iosPageLoadDelay: 100,
        mdPageLoadDelay: 100,
        stackPages: true
    },
    lazy: {
        threshold: 1500
    },
    panel: {
        //swipe: 'left'
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
      addImagesToCache: function(el) {

          $$(el).find('.save-to-cache').each(function (i) {

              var image = $$(this);
              var src;

              if (image.data('src') !== undefined) {

                  src = image.data('src');

              } else {

                  src = image.attr('src');

              }

              if (src.indexOf('blob') !== -1) {

                  return true;

              }

              var index = app.params.cachedImages.findIndex(image => image.src == src);
              var index2 = app.params.toCacheImages.indexOf(src);

              if (index == -1 && index == -1) {

                  app.params.toCacheImages.push(src);

              }

          });

      },
      cacheImages: function () {

          var app = this;
          var images = app.params.toCacheImages;

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

                  console.log(image);

                  if (value !== null) {

                      success(value, image);

                  } else {

                      app.request({
                          url: image,
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

                app.methods.cacheImages();

            }, 30000);

        }
    }
}).init();

app.request.setup({
    preloader: false,
    beforeSend: function(xhr) {

        preloaderTimeout = setTimeout(function() {

            if (xhr.requestParameters.preloader) {

                app.preloader.show();

            }

        }, 1000);

    },
    complete: function(xhr) {

        app.preloader.hide();
        clearTimeout(preloaderTimeout);

        //console.log(xhr);

    },
    error: function () {
        //app.dialog.alert('Проверьте подключение к интернету!', 'Ошибка');
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

    app.on('images:ready', function () {

        setTimeout(function () {

            navigator.splashscreen.hide();

        }, 2000);

    });

    setTimeout(function () {

        navigator.splashscreen.hide();

    }, 3000);

    viewUrls = [];

    for (var i = 0; i < app.views.length; i++) {
        viewUrls.push(app.views[i].params.url);
    }

    $$(window).on('panel:opened photobrowser:opened', function (event) {

        $$(document).on('backbutton', function () {

            var photoBrowser = app.photoBrowser.get($$(event.target));

            if (photoBrowser !== undefined) {

                photoBrowser.close();

            } else {

                app.panel.close('right', false);

            }

        });

    });

    $$(document).on('backbutton', function () {

        app.preloader.hide();

        path = app.views.current.router.currentRoute.path;

        if (viewUrls.indexOf(path) !== -1) {

            if (app.views.current.selector === '#view-main') {

                if (app.dialog.get('.dialog') == undefined) {

                    var confirmExit = app.dialog.confirm('Вы уверены что хотите закрыть приложение?', function () {

                        navigator.app.exitApp();

                    });

                } else {

                    navigator.app.exitApp();

                }

            } else {

                $$('.toolbar-menu').find('a[href="#view-projects"]').click();

            }

        } else {

            app.view.current.router.back();

        }

    });

});