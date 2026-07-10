function __everythingDevResolveHydrateModule(exports) {

  return Promise.resolve(exports).then(function (value) {

    var mod = value;

    if (mod && mod.__esModule && mod.default) {

      mod = mod.default;

    }

    if (typeof mod === "function") {

      return Promise.resolve(mod()).then(__everythingDevResolveHydrateModule);

    }

    if (mod && typeof mod.hydrate === "function") {

      return mod.hydrate();

    }

    if (typeof mod === "function") {

      return mod();

    }

    throw new TypeError("hydrate export missing");

  });

}



function __everythingDevWrapHydrateFactory(factory) {

  return function () {

    return {

      hydrate: function () {

        Promise.resolve(typeof factory === "function" ? factory.apply(this, arguments) : factory)

          .then(__everythingDevResolveHydrateModule)

          .catch(function (error) {

            console.error("[Hydrate] Failed:", error);

          });

      },

    };

  };

}



function __everythingDevPatchUiContainer(container) {

  if (!container || container.__everythingDevHydratePatched) {

    return container;

  }



  var originalGet =

    typeof container.get === "function" ? container.get.bind(container) : null;



  if (originalGet) {

    container.get = function (request) {

      return Promise.resolve(originalGet(request)).then(function (factory) {

        var name = String(request);

        if (name !== "./Hydrate" && name !== "Hydrate") {

          return factory;

        }

        return __everythingDevWrapHydrateFactory(factory);

      });

    };

  }



  container.__everythingDevHydratePatched = true;

  return container;

}



function __everythingDevReadUiContainer() {

  if (typeof window !== "undefined" && window.ui) {

    return window.ui;

  }

  try {

    if (typeof ui !== "undefined" && ui) {

      return ui;

    }

  } catch (_) {}

  return undefined;

}



function __everythingDevInstallHydratePatch() {

  var container = __everythingDevReadUiContainer();

  if (!container) {

    return false;

  }

  if (container.__everythingDevHydratePatched) {

    return true;

  }



  var patched = __everythingDevPatchUiContainer(container);

  if (typeof window !== "undefined") {

    window.ui = patched;

  }

  try {

    ui = patched;

  } catch (_) {}



  return true;

}



if (!__everythingDevInstallHydratePatch()) {

  var __everythingDevPatchAttempts = 0;

  var __everythingDevPatchTimer = setInterval(function () {

    if (__everythingDevInstallHydratePatch() || ++__everythingDevPatchAttempts >= 200) {

      clearInterval(__everythingDevPatchTimer);

    }

  }, 0);

}

