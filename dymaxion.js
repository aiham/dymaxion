/*
 * Dymaxion Puzzle Game
 * http://apps.aiham.net/dymaxion/
 *
 * Copyright 2011 Aiham Hammami
 * Released under a Creative Commons Attribution 3.0 Unported License.
 * http://creativecommons.org/licenses/by/3.0/
 *
 * Date: Wed Aug 13 08:15:03 2011 +0900
 */

// Use an anon function so we don't pollute the global scope
(function () {

  // JSLint parameters:
  // browser: true, maxerr: 50, indent: 2
  'use strict';

  // Get a reference to the gyudon namespace from the global scope
  var gyudon = window.gyudon,

    // Keep a reference of common functions
    each = gyudon.Util.each,
    keys = gyudon.Util.keys,
    indexOf = gyudon.Util.indexOf,
    arrayDiff = gyudon.Util.arrayDiff,
    arrayExcluding = gyudon.Util.arrayExcluding,
    shallowClone = gyudon.Util.shallowClone,

    // Declarations
    AsyncMonitor,
    Piece,
    Game,
    Controller,
    PieceImage,
    PopupView,
    MenuView,
    View,
    locale,

    // Random integer between min and max (inclusive)
    randomInt = function (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Random item from an array
    randomItem = function (arr) {
      return arr[randomInt(0, arr.length - 1)];
    },

    // Creates array populated with integers from a to b (inclusive)
    range = function (a, b) {
      var result = [];
      for (; a <= b; a += 1) {
        result.push(a);
      }
      return result;
    },

    // Constant for types of triangles
    tri_types = {
      isos: 1, // Isosceles triangle
      isos_down: 2, // Isosceles triangle point down
      right: 3, // Right angle triangle pointing right
      left: 4, // Right angle triangle pointing left
      equal: 5 // Equilteral triangle
    },

    // tri_map holds details about the position and orientation
    // of triangles on the Dymaxion Map
    // Default type is tri_types.equal, default flipped is false
    tri_map = {
      1: { pos: [2, 0], flipped: true },
      2: { pos: [3, 0] },
      3: { pos: [4, 0], flipped: true },
      4: { pos: [7, 0] },
      5: { pos: [9, 0] },
      6: { pos: [1, 1], flipped: true },
      7: { pos: [2, 1] },
      8: { pos: [3, 1], flipped: true },
      9: { pos: [4, 1] },
      10: { pos: [5, 1], flipped: true },
      11: { pos: [6, 1] },
      12: { pos: [7, 1], flipped: true },
      13: { pos: [8, 1] },
      14: { pos: [9, 1], flipped: true },
      15: { pos: [1, 2] },
      16: { pos: [4, 2], flipped: true },
      17: { pos: [6, 2], flipped: true },
      18: { pos: [7, 2] },
      19: { pos: [10, 1], type: tri_types.left },
      20: { pos: [0, 2], type: tri_types.right, flipped: true },
      21: { pos: [2, 2], type: tri_types.isos, flipped: true},
      22: { pos: [2, 2], type: tri_types.isos_down },
      23: { pos: [3, 2], type: tri_types.isos }
    };

  // Set default type and flipped for tri_map values
  // Changes tri_map[foo].pos from an array to gyudon.Coord type
  each(tri_map, function (piece) {
    piece.flipped = !!piece.flipped;
    piece.type = piece.type || tri_types.equal;
    piece.pos = new gyudon.Coord(piece.pos[0], piece.pos[1]);
  });

  // Locale object - manages text in both English and Japanese
  locale = {

    // If Japanese language isn't set then English is displayed instead
    lang: typeof navigator === 'object' &&
      indexOf.call(['ja', 'jp'], String(
        navigator.language ||
          navigator.browserLanguage ||
          navigator.userLanguage ||
          navigator.systemLanguage
      ).substr(0, 2)) >= 0 ? 'ja' : 'en',

    changeLang: function () {
      this.lang = this.lang === 'en' ? 'ja' : 'en';
    },

    // Returns the text depending on the currently set language
    get: function (label) {
      var lang = this.messages[this.lang][label] ? this.lang : 'en';
      return this.messages[lang][label];
    },

    // Dictionary of English and Japanese phrases used in the UI
    messages: {
      en: {
        title: 'Dymaxion Puzzle',
        button_lang: 'Japanese / 日本語',
        button_about: 'About this game',
        button_quit: 'End current game',
        button_new_game: 'Begin new game',
        button_shuffle: 'Shuffle pieces around',
        congrats: 'Congratulations!',
        puzzle_miyajima1: 'The famous Itsukushima, better known as Miyajima, near Hiroshima.',
        puzzle_miyajima2: 'Home of Itsukushima Shrine, a UNESCO World Heritage site.',
        puzzle_himeji1: 'Himeji Castle, one of the best preserved castles in Japan.',
        puzzle_himeji2: 'It is the largest and most visited and is also a UNESCO World Heritage site.',
        puzzle_nara1: 'These friendly deer can be found in Nara, near Kyoto and Osaka. They roam around',
        puzzle_nara2: 'central Nara and do not mind being pet. They do however try to eat your food.',
        puzzle_kiyomizu1: 'Kiyomizu-dera is a temple in Kyoto and is a UNESCO World Heritage site. It is',
        puzzle_kiyomizu2: 'situated ontop of a large hill, with an amazing view in both Spring and Autumn.',
        about_summary1: 'Dymaxion Puzzle is a simple puzzle game where you drag and drop puzzle pieces around the screen',
        about_summary2: 'and swap pieces until they match the original picture. My name is Aiham Hammami and I enjoy',
        about_summary3: 'making web apps using Javascript and new HTML5 APIs. This game is my submission for the Open',
        about_summary4: 'Call for Google Developer Day 2011. All photos used were taken by me while I was traveling around',
        about_summary5: 'Japan. I also created it to display the capabilities of Gyudon.js, my object oriented animated',
        about_summary6: 'canvas library. Please report bugs to aiham@aiham.net.',
        load_status: 'Loaded LOADED of TOTAL images.',
        load_status_error: 'Loaded LOADED of TOTAL images. ERROR images could not be loaded.',
        load_success: 'Loaded successfully.',
        load_fail: 'Some files were unable to load so the game might not run correctly. Please refresh if that is the case.'
      },

      ja: {
        title: 'ダイマクション・パズル',
        button_lang: 'English / 英語',
        button_about: 'ゲーム説明',
        button_quit: 'ゲームをやめる',
        button_new_game: '新しいゲームを始める',
        button_shuffle: 'シャフル',
        congrats: 'おめでとうございます！',
        puzzle_miyajima1: '広島の有名な厳島です。',
        puzzle_miyajima2: ' ',
        puzzle_himeji1: '姫路城です。',
        puzzle_himeji2: ' ',
        puzzle_nara1: '奈良のシカです。',
        puzzle_nara2: ' ',
        puzzle_kiyomizu1: '京都の清水寺です。',
        puzzle_kiyomizu2: ' '
      }
    }

  };


  // Async monitor class - calls asynchronous callback once all actions are complete
  AsyncMonitor = function (ids, callback, context) {
    this.pieces = {};
    this.callback = callback;
    this.context = context || this;
    this.is_called = false;

    each(ids, function (id) {
      this.pieces[id] = false;
    }, this);
  };

  AsyncMonitor.prototype = {

    constructor: AsyncMonitor,

    isDone: function () {
      var over = true;
      each(this.pieces, function (piece) {
        if (!piece) {
          over = false;
          return false;
        }
      });
      return over;
    },

    done: function (id) {
      this.pieces[id] = true;

      if (!this.is_called && this.isDone()) {
        this.is_called = true;
        this.callback.call(this.context);
      }
    },

    cancel: function () {
      this.is_called = true;
    }

  };

  // ScoreModel 

  // Game piece model class
  Piece = function (id, src, pos) {
    this.id = id;
    this.src = src;
    this.pos = pos;
  };

  // Game model class
  Game = function (pieces) {
    this.pieces = pieces;
    this.shuffle();
  };

  Game.prototype = {

    constructor: Game,

    destroy: function () {
      each(this.pieces, function (piece, i) {
        delete this.pieces[i];
        piece = null;
      }, this);
      delete this.pieces;
    },

    // Checks that all pieces are in correct positions
    isDone: function () {
      var over = true;

      each(this.pieces, function (piece, id) {
        if (Number(id) !== Number(piece.pos)) {
          over = false;
          return false;
        }
      });

      return over;
    },

    // Swaps two pieces of equal type
    swap: function (a, b) {
      var tmp;

      if (!this.pieces.hasOwnProperty(a) || !this.pieces.hasOwnProperty(b)) {
        throw 'Cant move pieces with invalid ids (' + a + ' and ' + b + ')';
      }

      if (tri_map[a].type !== tri_map[b].type) {
        throw 'Can only swap pieces of same type (' + a + ' and ' + b + ')';
      }

      tmp = this.pieces[a].pos;
      this.pieces[a].pos = this.pieces[b].pos;
      this.pieces[b].pos = tmp;

      return this;
    },

    // Moves around all pieces to random positions
    shuffle: function () {
      
      var used = [],
        // Separate the equilaterals and isosceles because triangles of different
        // types cannot be swapped with each other (different shaped images)
        equal = range(1, 18),
        // Only two of the three isosceles triangles can be swamped
        isos = [21, 23];

      each(this.pieces, function (piece, id) {
        var tri = tri_map[id], pos, avail;
        
        if (tri.type === tri_types.equal || tri.type === tri_types.isos) {

          // Find the positions that havent been used yet
          avail = arrayDiff(tri.type === tri_types.equal ? equal : isos, used);

          if (avail.length === 1) {

            pos = avail[0];

          } else if (avail.length < 1) {

            // This shouldn't occur
            throw 'Failed to complete shuffle: not enough piece ids';

          } else {

            pos = randomItem(avail);

          }

        } else {
          // The two right angle and one down isos triangle cannot change positions
          pos = id;
        }

        piece.pos = pos;
        used.push(pos);
      });

      return this.pieces;
    }

  };

  // Controller class
  Controller = function (view) {

    this.view = view;
    this.view.delegate = this;

    this.puzzles = ['miyajima', 'himeji', 'nara', 'kiyomizu'];

  };

  Controller.prototype = {

    constructor: Controller,

    // Begin the app
    go: function () {
      this.preload(function () {
        this.view.introduction(this.createPieces('intro'));
      }, this);

      return this;
    },

    // Load image resources
    preload: function (next, context) {
      this.view.preloadScreen(function () {
        var that = this, ids = [], monitor, done_load, load_image,
          tri_num = range(1, 23),
          menu_ids = ['new_game', 'shuffle', 'quit', 'about', 'en', 'ja'],
          total_files, loaded_files = 0, error_files = 0;

        each(this.puzzles.concat('intro'), function (puzzle) {
          each(tri_num, function (i) {
            ids.push(puzzle + '_' + i);
          });
          if (puzzle !== 'intro') {
            ids.push(puzzle + '_bg');
          }
        });

        each(shallowClone(menu_ids), function (id) {
          menu_ids.push(id + '_over');
        });

        ids = ids.concat(menu_ids, 'logo');

        total_files = ids.length;

        this.view.updatePreloadScreen(loaded_files, error_files, total_files);

        monitor = new AsyncMonitor(ids, function () {
          monitor = null;
          that = null;
          this.view.loadComplete(next, context, error_files);
        }, this);

        done_load = function (id) {
          return function () {
            loaded_files += 1;
            that.view.updatePreloadScreen(loaded_files, error_files, total_files);
            monitor.done(id);
            this.onload = null;
            this.onerror = null;
          };
        };

        load_image = function (id, src) {
          var image = new Image();
          image.onload = done_load(id);
          image.src = src;
          image.onerror = function () {
            error_files += 1;
            that.view.updatePreloadScreen(loaded_files, error_files, total_files);
            this.onerror = null;
            image = null;
            monitor.done(id);
          }
        };

        each(this.puzzles.concat('intro'), function (puzzle) {
          each(tri_num, function (id) {
            load_image(puzzle + '_' + id, that.imagePath(puzzle, id));
          });
          if (puzzle !== 'intro') {
            load_image(puzzle + '_bg', that.imagePath(puzzle, 'bg'));
          }
        });

        each(menu_ids, function (id) {
          load_image(id, 'img/menu/' + id + '.png');
        });

        load_image('logo', 'img/logo.png');

        done_load = load_image = null;
      }, this);

      return this;
    },

    changeLang: function () {
      locale.changeLang();
      this.view.changeLang();
      return this;
    },

    endGame: function () {
      this.view.endGame(this.createPieces('intro'));
      return this;
    },

    // Creates piece model instances for the specified puzzle
    createPieces: function (puzzle) {
      var pieces = {};

      each(keys(tri_map), function (id) {
        pieces[id] = new Piece(id, this.imagePath(puzzle, id), id);
      }, this);

      return pieces;
    },

    imagePath: function (puzzle, id, ext) {
      return 'img/puzzles/' + puzzle + '/' + id + '.' + (ext || 'png');
    },

    // New Game button pressed
    start: function () {
      var old_puzzle = this.puzzle;
      do {

        this.puzzle = randomItem(this.puzzles);

      } while (this.puzzle === old_puzzle);

      // Create a new game model instance
      this.game = new Game(this.createPieces(this.puzzle));

      this.view.start(this.game.pieces);

      return this;
    },

    // Shuffle Pieces button pressed
    shuffle: function () {
      // View moves all the pieces to new randomised positions
      this.view.disableUI().shuffle(this.game.shuffle(), function () {
        this.view.enableUI();
      }, this);

      return this;
    },

    // User stopped dragging a piece. Swaps two pieces if in valid position
    dragend: function (e, image1) {
      var move_back = true, image2;

      if (this.game) {
        each(keys(this.game.pieces), function (id) {
          image2 = this.view.board.itemWithTag(id);
          if (
            image2 &&
              image1.tag !== image2.tag &&
              image2.containsGlobalPoint(e.pos) &&
              tri_map[image2.tag].type === tri_map[image1.tag].type
          ) {
            move_back = false;
            return false;
          }
        }, this);
      }

      if (move_back) {
        this.view.disableUI().
          returnPiece(image1, function () {
            this.view.enableUI();
          }, this);
      } else {
        this.view.disableUI().
          swap(image1, image2, function () {
            this.game.swap(image1.tag, image2.tag);

            if (this.game.isDone()) {
              image1.trigger('out');
              image2.trigger('out');
              this.view.done(this.puzzle, function () {
                this.view.enableUI();
              }, this);
            } else {
              this.view.enableUI();
            }
          }, this);
      }

      return this;
    },

    destroy: function () {
      if (this.view) {
        this.view.destroy();
      }
      delete this.view;

      if (this.game) {
        this.game.destroy();
      }
      delete this.game;
    }
  };

  // Extending the gyudon.Item.Image type so that we can specify our own triangle
  // shaped hit test area, rather than the default rectangle shape
  PieceImage = gyudon.Item.Image.extend('PieceImage', {
    containsLocalPoint: gyudon.Item.Polygon.prototype.containsLocalPoint
  });

  PopupView = gyudon.Item.Rect.extend('PopupView', {

    init: function (options) {
      var monitor, that = this;

      this.onopened = options.onopened;
      this.onclosed = options.onclosed;

      this.context = options.context || this;

      this.fade_speed = options.fade_speed || 500;
      this.expand_speed = options.expand_speed || 500;

      this.canvas = options.canvas;
      delete options.canvas;

      each(this.canvas.items, function (item) {
        item.disableBinds(true);
      });

      gyudon.Item.Rect.prototype.init.call(this, {
        fill: options.tint || '#000000',
        alpha: 0,
        tag: 'popup',
        frame: new gyudon.Frame(0, 0, this.canvas.width, this.canvas.height)
      });

      this.canvas.addItem(this);

      this.content = options.content;

      this.box = new gyudon.Item.Rect({
        stroke: '#ffffff',
        fill: '#000000',
        frame: new gyudon.Frame(
          this.canvas.width / 2 - 1,
          this.canvas.height / 2 - 1,
          2,
          2
        ),
        hidden: true,
        tag: 'box'
      });

      this.canvas.addItem(this.box);

      this.close_button = new gyudon.Item.Circle({
        stroke: '#ffffff',
        fill: '#000000',
        radius: 17,
        center: new gyudon.Coord(this.content.frame.size.width, 0),
        tag: 'close',
        hidden: true
      });

      this.box.addItem(this.content.setAlpha(0).hide());
      this.box.addItem(this.close_button);

      this.close_button.bind('upinside', function () {
        that.closePopup();
      }).
        addItem(new gyudon.Item.Text({
          text: 'X',
          coord: new gyudon.Coord(17, 17),
          baseline: 'middle',
          align: 'center',
          fill: '#ffffff',
          font: 'normal 17px sans-serif',
          alpha: 0.5
        })).
        bind('over', function () {
          this.updateCursor('pointer').setAlpha(0.9);
        }).
        bind('out', function () {
          this.updateCursor('default').setAlpha(1);
        });

      monitor = new AsyncMonitor(['vert_move', 'vert_scale'], function () {
        monitor = new AsyncMonitor(['hori_move', 'hori_scale'], function () {
          this.content.show().fadeIn(this.fade_speed, function () {
            if (options.show_close !== false) {
              that.close_button.setAlpha(0).show().fadeIn(200);
            }

            if (typeof that.onopened === 'function') {
              that.onopened.call(that.context);
            }
          });
        }, this);

        this.box.moveTo(
          this.expand_speed,
          new gyudon.Coord(
            this.canvas.width / 2 - this.content.frame.size.width / 2,
            this.box.move.y
          ),
          function () {
            monitor.done('hori_move');
          }
        ).
          scaleTo(
            this.expand_speed,
            new gyudon.Size(
              this.content.frame.size.width,
              this.box.frame.size.height
            ),
            function () {
              monitor.done('hori_scale');
            }
          );
      }, this);

      this.fadeTo(this.fade_speed, 0.5, function () {
        this.box.show().moveTo(
          this.expand_speed,
          new gyudon.Coord(
            this.box.move.x,
            this.canvas.height / 2 - this.content.frame.size.height / 2
          ),
          function () {
            monitor.done('vert_move');
          }
        ).
          scaleTo(
            this.expand_speed,
            new gyudon.Size(
              this.box.frame.size.width,
              this.content.frame.size.height
            ),
            function () {
              monitor.done('vert_scale');
            }
          );
      });
    },

    closePopup: function () {
      var monitor = new AsyncMonitor(['tint', 'box'], function () {
        this.removeFromParent();
        this.box.removeFromParent();

        each(this.canvas.items, function (item) {
          if (item !== this && item !== this.box) {
            item.enableBinds(true);
          }
        }, this);

        this.canvas.setEnableBinds(true);

        if (typeof this.onclosed === 'function') {
          this.onclosed.call(this.context);
        }

        this.destroy();
      }, this);

      this.canvas.setEnableBinds(false);
      this.close_button.trigger('out');

      this.box.fadeOut(this.fade_speed, function () {
        monitor.done('box');
      });

      this.fadeOut(this.fade_speed, function () {
        monitor.done('tint');
      });

      return this;
    },

    destroy: function () {
      delete this.canvas;
      delete this.onopened;
      delete this.onclosed;
      delete this.context;

      gyudon.Item.Rect.prototype.destroy.call(this);
    }

  });

  MenuView = gyudon.Item.Rect.extend('MenuView', {

    init: function (parent, pos, next, context) {
      var details, onover, onout, onupinside, that = this;

      this.button_size = 30;
      this.button_pad = 8;
      this.in_game = false;
      this.parent = parent;

      gyudon.Item.Rect.prototype.init.call(this, {
        tag: 'menu',
        alpha: 0,
        frame: new gyudon.Frame(pos.x, pos.y, 1, 1)
      });
      this.stroke = false;
      this.parent.canvas.addItem(this);

      details = [
        { tag: 'about' },
        { tag: 'lang', src: locale.lang === 'en' ? 'ja' : 'en' },
        { tag: 'new_game' },
        { tag: 'shuffle', hidden: true },
        { tag: 'quit', hidden: true }
      ];

      onover = function () {
        this.image = this.image_over;
        this.updateCursor('pointer');
        that.showDescription(this.tag);
      };

      onout = function () {
        this.image = this.image_out;
        this.updateCursor('default');
        that.hideDescription();
      };

      onupinside = function (e) {
        this.trigger('out');
        that.parent.menuButtonPressed(this, e);
      };

      each(details, function (detail, i) {
        var image_over = new Image(), button;
        image_over.src = this.imagePath(detail.src || detail.tag, true);

        button = new gyudon.Item.Image({
          tag: detail.tag,
          frame: new gyudon.Frame(
            i * this.button_size + i * this.button_pad,
            0,
            this.button_size,
            this.button_size
          ),
          src: this.imagePath(detail.src || detail.tag),
          image_over: image_over,
          hidden: !!detail.hidden
        });

        image_over = null;

        button.image_out = button.image;

        this.addItem(button);

        button.bind('over', onover).
          bind('out', onout).
          bind('upinside', onupinside);
      }, this);

      this.itemWithTag('lang').lang = locale.lang;

      this.description = new gyudon.Item.Text({
        baseline: 'middle',
        font: 'bold 18px serif',
        fill: '#666666'
      });
      this.addItem(this.description);

      this.fadeIn(this.parent.speeds.menu_fade, function () {
        next.call(context);
      });

      details = null;
    },

    showInGameButtons: function (next, context, hide) {
      var tags = ['shuffle', 'quit'],
        monitor = new AsyncMonitor(tags, next, context);

      this.in_game = !hide;

      each(tags, function (tag) {
        var item = this.itemWithTag(tag), method;

        if (hide) {
          method = 'fadeOut';
        } else {
          method = 'fadeIn';
          item.setAlpha(0).show();
        }

        item[method](
          this.parent.speeds.menu_fade,
          function () {
            if (hide) {
              this.hide();
            }
            monitor.done(this.tag);
          }
        );
      }, this);

      return this;
    },

    imagePath: function (tag, over) {
      return 'img/menu/' + tag + (over ? '_over' : '') + '.png';
    },

    hideInGameButtons: function (next, context) {
      this.showInGameButtons(next, context, true);
      return this;
    },

    descriptionPos: function () {
      var count = this.in_game ? 5 : 3;

      return new gyudon.Coord(
        count * this.button_size + (count + 1) * this.button_pad,
        this.button_size / 2
      );
    },

    showDescription: function (tag) {
      this.description.setText(locale.get('button_' + tag)).
        moveTo(0, this.descriptionPos()).
        show();
      return this;
    },

    hideDescription: function () {
      this.description.hide();
      return this;
    },

    changeLang: function () {
      var button = this.itemWithTag('lang'),
        lang = button.lang;

      button.setSrc(this.imagePath(lang));
      button.image_out = button.image;

      button.image_over = new Image();
      button.image_over.src = this.imagePath(lang, true);

      button.lang = locale.lang;

      return this;
    },

    destroy: function () {
      each(this.items, function (item) {
        if (item.image_out) {
          item.image_out.onload = null;
          item.image_out.onerror = null;
          delete item.image_out;
        }
        if (item.image_over) {
          item.image_over.onload = null;
          item.image_over.onerror = null;
          delete item.image_over;
        }
      }, this);

      gyudon.Item.Rect.prototype.destroy.call(this);
    }

  });

  // View class
  View = function () {
    // Length of a square piece's side
    this.piece_size = 150;

    // For determining the triangle's vertices inside its rectangular container
    // Using these ratios this.piece_size can be changed without worrying about
    // where the triangle vertices are since everything is proportional
    this.size_ratios = {
      x_gap: 0.5,
      y_gap: 0.08217,
      tri_top: 0.07867,
      tri_side: 0.02972,
      tri_bottom: 0.05944,
      left_tri_middle: 0.48568,
      left_tri_top: 0.11369,
      right_tri_left: 0.06596,
      right_tri_right: 0.25884,
      right_tri_bottom: 0.52414,
      isos_down_side: 0.06591,
      isos_down_bottom: 0.66612,
      isos_top: 0.11629,
      isos_left: 0.51753,
      isos_right: 0.04991,
      isos_bottom_right: 0.09231,
      isos_bottom_left: 0.36215
    };

    var board_size = new gyudon.Size(
      this.piece_size * this.size_ratios.x_gap * 12,
      this.piece_size * 3 - this.piece_size * this.size_ratios.y_gap * 2
    );

    // Initialise animated canvas and appends to DOM
    this.canvas = new gyudon.Manager(board_size.width, board_size.height + 70);
    window.document.getElementById('canvas').appendChild(this.canvas.e);

    // Initialise container to hold all the triangle pieces
    this.board = new gyudon.Item.Rect({
      tag: 'board',
      frame: new gyudon.Frame(0, 70, board_size.width, board_size.height)
    });
    this.board.stroke = false;
    this.canvas.addItem(this.board);

    this.canvas.addItem(new gyudon.Item.Text({
      text: locale.get('title'),
      align: 'right',
      baseline: 'top',
      font: 'bold italic 45px serif',
      fill: 'black',
      coord: new gyudon.Coord(this.canvas.width - 20, 20),
      tag: 'title'
    }));

    // Animation speeds (in miliseconds)
    this.speeds = {
      move_back: 400,
      move_to: 400,
      move_inside: 1600,
      move_outside: 600,
      logo_fade: 500,
      rotate_left: 600,
      left_wait: 600,
      menu_fade: 1000,
      preload_fade: 1000,
      spinner: 800,
      spinner_fade: 1800,
      shuffle: 1000,
      bg_fade: 600
    };

    this.canvas.start();
  };

  View.prototype = {

    constructor: View,

    createActivitySpinner: function (parent, center, size) {
      var l = 8, spin, that = this, radius = size / 2,
        spinner = new gyudon.Item.Rect({
          tag: 'spinner',
          frame: new gyudon.Frame(
            center.x - radius,
            center.y - radius,
            size,
            size
          ),
          pivot: new gyudon.Coord(radius, radius)
        });
      spinner.stroke = false;
      parent.addItem(spinner);

      each(range(0, l - 1), function (i) {
        var dot = new gyudon.Item.Circle({
          radius: 2 + i,
          center: new gyudon.Coord(
            radius + radius * gyudon.Math.cos(gyudon.Math.TWO_PI / l * i),
            radius + radius * gyudon.Math.sin(gyudon.Math.TWO_PI / l * i)
          ),
          stroke: 'white',
          stroke_width: 1,
          fill: 'gray',
          alpha: (i + 1) / l 
        });

        spinner.addItem(dot);
      });

      spin = function () {
        spinner.rotateBy(
          that.speeds.spinner,
          Math.PI,
          function () {
            spin();
          }
        );
      };
      spin();

      return this;
    },

    preloadScreen: function (next, context) {
      this.createAboutContent(next, context, true);
      return this;
    },

    updatePreloadScreen: function (loaded, error, total) {
      this.popup.content.itemWithTag('load_status').setText(
        locale.get(error > 0 ? 'load_status_error' : 'load_status').
          replace('LOADED', loaded).
          replace('ERROR', error).
          replace('TOTAL', total)
      );
      return this;
    },

    loadComplete: function (next, context, error) {
      var that = this;

      if (this.load_timer) {
        window.clearTimeout(this.load_timer);
        delete this.load_timer;
      }

      this.popup.onclosed = function () {
        next.call(context);
        delete that.popup;
      };

      this.popup.content.itemWithTag('spinner').fadeOut(
        this.speeds.spinner_fade,
        function () {
          this.hide();

          that.popup.content.addItem(new gyudon.Item.Text({
            coord: new gyudon.Coord(
              that.popup.content.frame.size.width / 2,
              this.move.y + this.frame.size.height / 2
            ),
            align: 'center',
            baseline: 'middle',
            fill: '#ffffff',
            text: locale.get(error < 1 ? 'load_success' : 'load_fail'),
            tag: 'load_complete'
          }));

          this.removeFromParent();
          this.destroy();

          that.popup.close_button.setAlpha(0).show().
            unbind(['over', 'out']).fadeIn(200, function () {
              var fader;
              fader = function () {
                that.popup.close_button.fadeTo(1200, 0.5, function () {
                  this.fadeIn(1200, function () {
                    fader();
                  });
                });
              };
              fader();
              this.bind('over', function () {
                this.updateCursor('pointer');
              }).
                bind('out', function () {
                  this.updateCursor('default');
                });
            });
        }
      );

      return this;
    },

    introduction: function (pieces) {
      this.disableUI().
        createPiecesOutside(pieces, function () {

          this.showLogo().
            movePiecesInside(function () {

              this.createMenu(function () {
                this.enableUI();
              }, this);

            }, this, true);

        }, this);

      return this;
    },

    showLogo: function (hide) {
      var that = this, logo_pos,
        logo = this.canvas.itemWithTag('logo');

      if (hide && logo) {
        logo.fadeOut(
          this.speeds.logo_fade,
          function () {
            this.hide();
          }
        );
      } else if (logo) {
        logo.setAlpha(0).show().fadeIn(this.speeds.logo_fade);
      } else {
        logo_pos = this.coordForTri('logo');

        this.canvas.addItem(new gyudon.Item.Image({
          frame: new gyudon.Frame(
            logo_pos.x,
            logo_pos.y + this.board.move.y,
            this.piece_size,
            this.piece_size
          ),
          tag: 'logo',
          alpha: 0,
          src: 'img/logo.png',
          onload: function () {
            this.fadeIn(that.speeds.logo_fade);
            that = null;
          }
        }));
        this.canvas.moveItemWithTagToBack('logo');
      }

      logo = null;
      logo_pos = null;
      return this;
    },

    endGame: function (pieces) {
      var monitor = new AsyncMonitor(['menu', 'pieces'], function () {

          this.createPiecesOutside(pieces, function () {

            this.showLogo().
              movePiecesInside(function () {
                this.enableUI();
              }, this, true);

          }, this);

        }, this);

      this.disableUI().
        movePiecesOutside(function () {monitor.done('pieces'); }, this).
        menu.hideInGameButtons(function () {monitor.done('menu'); }, this);

      return this;
    },

    createAboutContent: function (next, context, is_preload) {
      var width = 700, height = is_preload ? 440 : 304,
        content = new gyudon.Item.Rect({
          frame: new gyudon.Frame(0, 0, width, height)
        }),
        options = {
          content: content,
          show_close: !is_preload,
          onopened: next,
          context: context
        },
        textOptions = function (label, y) {
          return {
            text: locale.get(label),
            coord: new gyudon.Coord(width / 2, y),
            baseline: 'middle',
            align: 'center',
            fill: '#ffffff'
          }
        };

      content.stroke = false;

      content.
        addItem(new gyudon.Item.Text(textOptions('about_summary1', 50))).
        addItem(new gyudon.Item.Text(textOptions('about_summary2', 90))).
        addItem(new gyudon.Item.Text(textOptions('about_summary3', 130))).
        addItem(new gyudon.Item.Text(textOptions('about_summary4', 170))).
        addItem(new gyudon.Item.Text(textOptions('about_summary5', 210))).
        addItem(new gyudon.Item.Text(textOptions('about_summary6', 250)));

      this.addPopupView(options);

      if (is_preload) {
        this.createActivitySpinner(
          content,
          new gyudon.Coord(
            content.frame.size.width / 2,
            content.frame.size.height - 115
          ),
          50
        );

        content.addItem(new gyudon.Item.Text({
          tag: 'load_status',
          coord: new gyudon.Coord(width / 2, 390),
          baseline: 'middle',
          align: 'center',
          fill: '#ffffff'
        }));
      }

      return this;
    },

    createMenu: function (next, context) {
      this.menu = new MenuView(this, new gyudon.Coord(20, 30), next, context);
      return this;
    },

    menuButtonPressed: function (button, e) {
      var tag = button.tag,
        action_map = {
          new_game: 'start',
          shuffle: 'shuffle',
          quit: 'endGame',
          lang: 'changeLang'
        };

      if (action_map.hasOwnProperty(tag)) {
        this.callDelegate(action_map[tag], [e]);
      } else if (tag === 'about') {
        this.disableUI().createAboutContent(function () {
          this.enableUI();
        }, this);
      }

      return this;
    },

    // For sending messages back to the controller
    callDelegate: function (method, args) {
      return this.delegate[method].apply(this.delegate, args);
    },

    changeLang: function () {
      this.menu.changeLang();
      this.canvas.itemWithTag('title').text = locale.get('title');
    },

    // Creates PieceImages using details provided from the Game model, then adds them to the canvas
    // also creates a gyudon.Item.Polygon instance for each piece to act as its border
    createPiecesOutside: function (pieces, next, context) {
      var monitor = new AsyncMonitor(keys(pieces), next, context),
        s = this.piece_size,
        r = this.size_ratios,
        top = s * r.tri_top,
        bottom = s * (1 - r.tri_bottom),
        flipped_bottom = s * (1 - r.tri_top),
        flipped_top = s * r.tri_bottom,
        left = s * r.tri_side,
        right = s * (1 - r.tri_side),
        image_onload = function () {
          monitor.done(this.tag);
        };

      each(pieces, function (piece, id) {
        var a, b, c, image, random_pos;

        // a, b, c contain the coordinates of the vertices of each triangle
        // Different sized triangles need to be treated differently
        if (tri_map[id].type === tri_types.equal) {
          if (tri_map[id].flipped) {
            a = [left, flipped_top];
            b = [right, flipped_top];
            c = [s / 2, flipped_bottom];
          } else {
            a = [left, bottom];
            b = [right, bottom];
            c = [s / 2, top];
          }
        } else if(tri_map[id].type === tri_types.isos) {
          if (tri_map[id].flipped) {
            a = [s * (1 - r.isos_left), s * (1 - r.isos_top)];
            b = [s * (1 - r.isos_left), s * r.isos_bottom_left];
            c = [s * r.isos_right, s * r.isos_bottom_right];
          } else {
            a = [s * r.isos_left, s * r.isos_top];
            b = [s * r.isos_left, s * (1 - r.isos_bottom_left)];
            c = [s * (1 - r.isos_right), s * (1 - r.isos_bottom_right)];
          }
        } else if (tri_map[id].type === tri_types.isos_down) {
          a = [s * r.isos_down_side, s * r.tri_bottom];
          b = [s * (1 - r.isos_down_side), s * r.tri_bottom];
          c = [s / 2, s * (1 - r.isos_down_bottom)];
        } else if (tri_map[id].type === tri_types.left) {
          a = [left, bottom];
          b = [s * r.left_tri_middle, bottom];
          c = [s * r.left_tri_middle, s * r.left_tri_top];
        } else if (tri_map[id].type === tri_types.right) {
          a = [s * r.right_tri_left, flipped_top];
          b = [right, flipped_top];
          c = [s * (1 - r.right_tri_right), s * (1 - r.right_tri_bottom)];
        }

        random_pos = this.getRandomPosOutside();
        image = (new PieceImage({
          src: piece.src,
          frame: new gyudon.Frame(
            random_pos.x,
            random_pos.y,
            this.piece_size,
            this.piece_size
          ),
          pivot: new gyudon.Coord(this.piece_size / 2, this.piece_size / 2),
          rotate: gyudon.Math.rad(randomInt(0, 360)),
          points: [
            new gyudon.Coord(a[0], a[1]),
            new gyudon.Coord(b[0], b[1]),
            new gyudon.Coord(c[0], c[1])
          ],
          tag: id,
          tri_id: piece.pos,
          onload: image_onload
        })).
          addItem(new gyudon.Item.Polygon({
            frame: new gyudon.Frame(
              0,
              0,
              this.piece_size,
              this.piece_size
            ),
            points: [
              new gyudon.Coord(a[0], a[1]),
              new gyudon.Coord(b[0], b[1]),
              new gyudon.Coord(c[0], c[1])
            ],
            tag: 'border',
            stroke: 'red',
            stroke_width: 1,
            hidden: true
          }));
        this.board.addItem(image);
      }, this);

      s = null;
      r = null;

      return this;
    },

    // Returns a random position outside the canvas to move pieces to
    getRandomPosOutside: function () {
      return new gyudon.Coord(
        randomInt(0, this.canvas.width - this.piece_size) - this.board.move.x,
        -this.board.move.y + (randomInt(0, 1) > 0 ?
          this.canvas.height + this.piece_size :
          -this.piece_size * 2)
      );
    },

    // Moves pieces from outside the canvas to their designated place on the Dymaxion Map
    movePiecesInside: function (next, context, is_intro) {
      var ids = [], monitor, that = this,
        done_move, done_rotate1, done_rotate2, done_rotate3, done_wait;

      each(range(1, 23), function (i) {
        ids.push(i, i + '_rotate');
      });

      monitor = new AsyncMonitor(ids, next, context);

      done_move = function () {
        monitor.done(this.tag);
      };

      done_rotate1 = function () {
        this.setPivot(new gyudon.Coord(
          this.frame.size.width / 2,
          this.frame.size.height / 2
        ));
        monitor.done(this.tag + '_rotate');
      };

      done_wait = function () {
        this.rotateTo(that.speeds.rotate_left, 0, done_rotate1);
      };

      done_rotate2 = function () {
        that.canvas.wait(that.speeds.left_wait, done_wait, this);
      };

      done_rotate3 = function () {
        monitor.done(this.tag + '_rotate');
      };
      
      each(this.board.items, function (image) {
        var tri = tri_map[image.tri_id];

        image.moveTo(
          this.speeds.move_inside,
          this.coordForTri(image.tri_id),
          done_move
        );
        if (is_intro && tri.type === tri_types.left) {
          image.setPivot(new gyudon.Coord(0, image.frame.size.height)).
            rotateTo(
              this.speeds.move_inside,
              gyudon.Math.PI_2,
              done_rotate2
            );
        } else {
          image.rotateTo(
            this.speeds.move_inside,
            tri_map[image.tag].flipped !== tri.flipped ? Math.PI : 0,
            done_rotate3
          );
        }
      }, this);

      return this;
    },

    // Move pieces outside the canvas where they cannot be seen
    movePiecesOutside: function (next, context) {
      var ids = [], monitor, done_move, done_rotate;

      delete this.current_drag;

      each(range(1, 23), function (i) {
        ids.push(i, i + '_rotate');
      });

      monitor = new AsyncMonitor(ids, function () {
        each(this.board.items, function (item) {
          item.destroy();
          item = null;
        }, this);
        this.board.removeAllItems();
        next.call(context);
      }, this);

      done_move = function () {
        monitor.done(this.tag);
      };

      done_rotate = function () {
        monitor.done(this.tag + '_rotate');
      };
      
      each(this.board.items, function (item) {
        item.moveTo(
          this.speeds.move_outside,
          this.getRandomPosOutside(),
          done_move
        ).
          rotateBy(
            this.speeds.move_outside,
            Math.PI * 2,
            done_rotate
          );
      }, this);

      return this;
    },

    // Hook dragging and hover bindings to all the pieces
    addPieceBindings: function () {
      var that = this,

        bind_down = function () {
          var waiting, excluding;

          // Prevents two more pieces being dragged at the same time
          if (that.current_drag) {
            waiting = that.canvas.bind_manager.waiting;
            excluding = [this];

            waiting.upinside = arrayExcluding(waiting.upinside, excluding);
            waiting.upoutside = arrayExcluding(waiting.upoutside, excluding);
            waiting.dragstart = arrayExcluding(waiting.dragstart, excluding);
            return;
          }
          that.current_drag = true;
        },

        bind_dragstart = function () {
          delete that.current_drag;
          this.itemWithTag('border').show();
          that.board.moveItemToFront(this);
        },

        bind_dragend = function (e) {
          delete that.current_drag;
          this.itemWithTag('border').hide();
          that.callDelegate('dragend', [e, this]);
        },

        bind_over = function () {
          this.setAlpha(0.8);
        },

        bind_out = function () {
          delete that.current_drag;
          this.setAlpha(1);
        };

      each(this.board.items, function (item) {
        item.setDragable(true).
          bind('down', bind_down).
          bind('dragstart', bind_dragstart).
          bind('dragend', bind_dragend).
          bind('over', bind_over).
          bind('out', bind_out);
      });

      return this;
    },

    // Returns the canvas coordinate for a piece correspending to its position on the Dymaxion Map
    coordForTri: function (id) {
      var pos = id === 'logo' ? new gyudon.Coord(9, 2) : tri_map[id].pos;
      return new gyudon.Coord(
        pos.x * this.piece_size * this.size_ratios.x_gap,
        pos.y * this.piece_size - this.piece_size * this.size_ratios.y_gap * pos.y
      );
    },

    // Swaps two pieces and rotates them if necessary
    swap: function (image1, image2, next, context) {
      var rotate = false,
        monitor,
        ids = [image1.tag, image2.tag],
        tmp;

      if (tri_map[image1.tri_id].flipped !== tri_map[image2.tri_id].flipped) {
        rotate = true;
        ids.push(image1.tag + '_rotate', image2.tag + '_rotate');
      }

      monitor = new AsyncMonitor(ids, next, context);

      tmp = image1.tri_id;

      image1.moveTo(
        this.speeds.move_to,
        this.coordForTri(image2.tri_id),
        function () {
          this.tri_id = image2.tri_id;
          monitor.done(this.tag);
        }
      );
      image2.moveTo(
        this.speeds.move_to,
        this.coordForTri(tmp),
        function () {
          this.tri_id = tmp;
          monitor.done(this.tag);
        }
      );

      if (rotate) {
        image1.rotateBy(
          this.speeds.move_to,
          Math.PI,
          function () {
            monitor.done(this.tag + '_rotate');
          }
        );
        image2.rotateBy(
          this.speeds.move_to,
          Math.PI,
          function () {
            monitor.done(this.tag + '_rotate');
          }
        );
      }
      return this;
    },

    // Returns a piece to its original position after the user lets it go
    returnPiece: function (image, next, context) {
      image.moveTo(
        this.speeds.move_back,
        this.coordForTri(image.tri_id),
        function () {
          next.call(context);
        }
      );
      return this;
    },

    // Starts a new game by clearing the current pieces, loading the new pieces, then moving them inside the canvas
    start: function (pieces) {
      var bg = this.canvas.itemWithTag('bg');
      if (bg) {
        bg.fadeOut(this.speeds.bg_fade, function () {
          this.removeFromParent();
          this.destroy();
        });
      }
      bg = null;

      this.disableUI().
        movePiecesOutside(function () {

          this.showLogo(true).
            createPiecesOutside(pieces, function () {

              this.movePiecesInside(function () {
                var callback = function () {
                    this.addPieceBindings().enableUI();
                  };

                if (!this.menu.in_game) {
                  this.menu.showInGameButtons(callback, this);
                } else {
                  callback.call(this);
                }

              }, this);

            }, this);

        }, this);

      return this;
    },

    // Moves all pieces around to new random positions on the Dymaxion Map
    shuffle: function (pieces, next, context) {
      var ids = [], monitor, done_move, done_rotate;

      each(range(1, 23), function (i) {
        ids.push(i, i + '_rotate');
      });

      monitor = new AsyncMonitor(ids, next, context);

      done_move = function () {
        this.tri_id = pieces[this.tag].pos;
        monitor.done(this.tag);
      };

      done_rotate = function () {
        monitor.done(this.tag + '_rotate');
      };

      each(this.board.items, function (image) {
        image.moveTo(
          this.speeds.shuffle,
          this.coordForTri(pieces[image.tag].pos),
          done_move
        );

        if (tri_map[image.tri_id].flipped !== tri_map[pieces[image.tag].pos].flipped) {
          image.rotateBy(
            this.speeds.shuffle,
            Math.PI,
            done_rotate
          );
        } else {
          monitor.done(image.tag + '_rotate');
        }
      }, this);

      return this;
    },

    hint: function (text) {
      
    },

    // Gets called before animations begin, disables buttons
    disableUI: function () {
      this.canvas.setEnableBinds(false);
      return this;
    },

    // Gets called after animations are done, enables buttons
    enableUI: function () {
      this.canvas.setEnableBinds(true);
      return this;
    },

    // Game complete, shows full picture
    done: function (puzzle, next, context) {
      var that = this, after_bg,
        monitor = new AsyncMonitor(['menu', 'popup'], next, context);

      each(this.board.items, function (item) {
        item.setDragable(false);
      });

      after_bg = function () {
        var content;

        that.menu.hideInGameButtons(function () {
          monitor.done('menu');
        }, that);

        content = new gyudon.Item.Rect({
          frame: new gyudon.Frame(0, 0, 500, 180)
        });

        content.addItem(new gyudon.Item.Text({
          text: locale.get('congrats'),
          coord: new gyudon.Coord(250, 50),
          baseline: 'middle',
          align: 'center',
          fill: '#ffffff',
          font: 'bold italic 20px serif'
        }));

        content.addItem(new gyudon.Item.Text({
          text: locale.get('puzzle_' + puzzle + '1'),
          coord: new gyudon.Coord(250, 100),
          baseline: 'middle',
          align: 'center',
          fill: '#ffffff'
        }));

        content.addItem(new gyudon.Item.Text({
          text: locale.get('puzzle_' + puzzle + '2'),
          coord: new gyudon.Coord(250, 130),
          baseline: 'middle',
          align: 'center',
          fill: '#ffffff'
        }));

        that.addPopupView({
          content: content,
          onopened: function () {
            monitor.done('popup');
          },
          context: that
        });

        content = null;
        that = null;
        after_bg = null;
      };

      var bg = new gyudon.Item.Image({
        frame: new gyudon.Frame(
          this.board.move.x,
          this.board.move.y,
          11 * this.piece_size * this.size_ratios.x_gap,
          3 * this.piece_size - this.piece_size * this.size_ratios.y_gap * 2
        ),
        src: 'img/puzzles/' + puzzle + '/bg.png',
        hidden: true,
        tag: 'bg',
        onerror: function () {
          after_bg.call(this);
        },
        onload: function () {
          this.setAlpha(0).show().fadeIn(
            that.speeds.bg_fade,
            after_bg
          );
        }
      });

      this.canvas.addItem(bg).moveItemToBack(bg);

      return this;
    },

    // Shows a lightbox popup container
    addPopupView: function (options) {
      var that = this;

      this.popup = new PopupView({
        canvas: this.canvas,
        content: options.content,
        show_close: options.show_close !== false,
        onopened: options.onopened,
        onclosed: function () {
          if (typeof options.onclosed === 'function') {
            options.onclosed.call(that.popup.context);
          }
          delete that.popup;
        },
        context: options.context || this
      });
    },

    destroy: function () {
      if (this.popup) {
        this.popup.destroy();
      }
      delete this.popup;

      if (this.menu) {
        this.menu.destroy();
      }
      delete this.menu;

      if (this.canvas) {
        this.canvas.destroy();
      }
      delete this.canvas;
    }

  };

  // Add to outer scope for later release
  var c;

  // Initialiser method
  window.onload = function () {
    var v = new View();

    c = new Controller(v);
    c.go();
  };

  window.onunload = function () {
    if (c) {
      c.destroy();
    }
    c = null;

    if (gyudon) {
      gyudon.destroy();
    }
    gyudon = null;
    delete window.gyudon;
  };

}());
