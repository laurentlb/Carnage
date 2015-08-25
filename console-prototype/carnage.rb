# -*- coding: utf-8 -*-

class GameParameters
  class << self
    def number_of_worms(player_count)
      20
    end
    def number_of_visible_cards
      5
    end
    def side_size
      6
    end
    def moves_per_turn
      3
    end
  end
end

#class Direction # TODO: remplacer les tableaux d'ints par une classe propre
#end

# A point in hexagonal topology. Immutable.
class Point
  def Point.directions
    [[0,1], [1,0], [1,1], [0,-1], [-1,0], [-1,-1]]
  end
  def Point.are_valid(x, y)
    x >= 0 && x < 2*GameParameters.side_size-1 &&
      y >= 0 && y < 2*GameParameters.side_size-1 &&
      x-y > -GameParameters.side_size && x-y < GameParameters.side_size
  end
  def Point.number_of_points
    3 * GameParameters.side_size ** 2 - 3 * GameParameters.side_size + 1
  end
  def Point.random_point
    point = [-1,-1]
    until Point.are_valid(*point)
      point = [rand(2*GameParameters.side_size-1), rand(2*GameParameters.side_size-1)]
    end
    Point.new(*point)
  end
  def Point.ascii_render(worms, &render_worm)
    lines = []
    for y in 0..(2*GameParameters.side_size-2)
      line = []
      for x in 0..(2*GameParameters.side_size-2)
        next unless Point.are_valid(x, y)
        worm = worms.find { |w| w.point == Point.new(x, y) }
        str = render_worm[worm]
        line << str
      end
      line = (' ' * (GameParameters.side_size - 1 - y).abs) + line.join(' ')
      lines << line
    end
    lines
  end

  attr_reader :x, :y
  def initialize(x, y)
    fail "bad coordinates: #{x}, #{y}" unless Point.are_valid(x, y)
    @x, @y = x, y
  end
  def to_s
    "{#{x},#{y}}"
  end
  def ==(other)
    @x == other.x && @y == other.y
  end

  def neighbors
    Point.directions
      .map { |c| [@x + c[0], @y + c[1]] }
      .select { |c| Point.are_valid(*c) }
      .map { |c| Point.new(*c) }
  end

  def distance(point)
    dx, dy = point.x - @x, point.y - @y
    if dx * dy > 0
      [dx.abs, dy.abs].max
    else
      dx.abs + dy.abs
    end
  end

  def is_lined_up_with(point)
    dx, dy = point.x - @x, point.y - @y
    return dx == 0 || dy == 0 || dx - dy == 0
  end

  def line_to(point_or_direction) # source included, dest included, in order
    if point_or_direction.is_a? Point
      point = point_or_direction
      dx, dy = point.x - @x, point.y - @y
      interval = lambda { |n,m| n < m ? n.upto(m) : n.downto(m) }
      return interval[@y, point.y].map { |y| Point.new(@x, y) } if dx == 0
      return interval[@x, point.x].map { |x| Point.new(x, @y) } if dy == 0
      fail if dx != dy
      s = dx > 0 ? 1 : -1
      return (0..dx).map { |d|
        Point.new(@x+d*s, @y+d*s)
      }
    else
      direction = point_or_direction
      r = []
      p = self
      until p.nil?
        r << p
        p = p.offset(direction)
      end
      r
    end
  end

  def line_between(point)
    line_to(point)[1..-2]
  end

  def offset(direction)
    x, y = @x + direction[0], @y + direction[1]
     Point.are_valid(x,y) ? Point.new(x, y) : nil
  end

end


class Worm
  attr_accessor :name, :point, :player_id, :injured
  def initialize(name, point, player_id)
    fail "worm playerId" unless player_id == -1 || player_id >= 0
    @name, @point, @player_id, @injured = name, point, player_id, false
  end
  def to_s
    "#{name}#{point}"
  end
end

class Player
  attr_accessor :name, :dead
  def initialize(name)
    @name = name
    @dead = false
  end
  def to_s
    @name
  end
end

class InvalidActionException < Exception
end

class GameState
  def GameState.random_worms(players, worm_count)
    worms = []
    for i in 0..(worm_count-1)
      point = Point.random_point
      until worms.all? {|w| w.point != point }
        point = Point.random_point
      end
      player_id = i < players.size * 2 ? i / 2 : -1
      name = (i + 'a'.ord).chr
      worms << Worm.new(name, point, player_id)
    end
    worms
  end

  attr_accessor :events, :players, :worms, :upcoming_cards, :visible_cards, :active_worm, :turn
  def initialize(players, events)
    worm_count = GameParameters.number_of_worms(players.size)
    assert(worm_count > players.size * 2, 'Not enough worms for all players!')
    assert(worm_count <= Point.number_of_points, 'Too many worms for this board!')
    @events = events
    @players = players
    @turn = 0
    @worms = GameState.random_worms(players, worm_count)
    @active_worm = @worms.sample
    @visible_cards = []
    @upcoming_cards = Card.deck.shuffle
    GameParameters.number_of_visible_cards.times { draw_new_card! }
  end

  def active_player
    @players[@turn % @players.size]
  end
  def next_player
    @players[(@turn + 1) % @players.size]
  end

  def worm_to_char(worm)
    if worm.nil?
      '.'
    else
      worm.injured ? worm.name.upcase : worm.name.downcase
    end
  end

  def worms_on_points(points)
    @worms.select { |worm| points.include?(worm.point) }
  end

  def nearest_worm(direction)
    line = @active_worm.point.line_to(direction)[1..-1]
    line.map { |p| @worms.find { |w| w.point == p } }.compact.first
  end


  def play_card!(card)
    assert(@visible_cards.include? card)
    @events.card_played(card)
    card.execute(self, @events)
    @visible_cards.delete card
    @upcoming_cards.push card # au cas où
    draw_new_card!
  end

  def draw_new_card!
    @visible_cards << @upcoming_cards.shift
  end

  def move!(direction)
    newPoint = @active_worm.point.offset(direction)
    fail InvalidActionException.new('Cannot move out of map!') if newPoint.nil?
    fail InvalidActionException.new('Cannot move into another worm!') if worms_on_points([newPoint]).any?
    @active_worm.point = newPoint
  end


  def kill_worm!(worm)
    return unless @worms.include?(worm)
    @worms.delete worm
    @events.worm_killed(worm)
    for player in @players
      if !player.dead && @worms.count { |w| w.player_id == @players.index(player) } == 0
        player.dead = true
        @events.player_dies(player)
      end
    end
    alive_players = @players.select { |p| !p.dead }
    @events.game_end(alive_players.first) if alive_players.size <= 1
  end

  def harm_worm!(worm)
    return unless @worms.include?(worm)
    if worm.injured
      kill_worm!(worm)
    else
      worm.injured = true
      @events.worm_injured(worm)
    end
  end

  def push_worm!(worm, direction)
    return unless @worms.include?(worm)
    behind = worm.point.offset(direction)
    if behind.nil?
      kill_worm!(worm)
    else
      worm_behind = worms_on_points([behind]).first
      push_worm!(worm_behind, direction) unless worm_behind.nil?
      worm.point = behind
    end
  end
end


class Card
  def Card.deck
    ([Shotgun] * 4 +
     [Pistol, FlameThrower] * 3 +
     [Bow, BaseballBat] * 3 +
     [Kamikaze, Hook] * 2
     ).map(&:new)
  end
  def name
    self.class.to_s.gsub(/([a-z])([A-Z])/) { "#{$1} #{$2}" }
  end
end

class Kamikaze < Card
  def execute(g, ui)
    p = g.active_worm.point
    g.kill_worm!(g.active_worm)
    for w in g.worms_on_points(p.neighbors)
      g.harm_worm!(w)
    end
  end
end

class Pistol < Card
  def execute(g, ui)
    direction = ui.read_direction
    target_worm = g.nearest_worm(direction)
    g.harm_worm!(target_worm) unless target_worm.nil?
    direction2 = direction
    until direction2 != direction
      direction2 = ui.read_direction
    end
    target_worm = g.nearest_worm(direction2)
    g.harm_worm!(target_worm) unless target_worm.nil?
  end
end

class Shotgun < Card
  def execute(g, ui)
    direction = ui.read_direction
    target_worm = g.nearest_worm(direction)
    if !target_worm.nil?
      g.push_worm!(target_worm, direction)
      g.harm_worm!(target_worm)
    else
      warn "no target"
    end
  end
end

class Bow < Card
  def execute(g, ui)
    direction = ui.read_direction
    target_worm = g.nearest_worm(direction)
    if !target_worm.nil?
      g.push_worm!(target_worm, direction)
      g.push_worm!(target_worm, direction)
    else
      warn "no target"
    end
  end
end

class FlameThrower < Card
  def range
    4
  end
  def execute(g, ui)
    direction = ui.read_direction
    points = g.active_worm.point.line_to(direction)[1..4]
    worms = g.worms_on_points(points)
    for worm in worms
      g.harm_worm!(worm)
    end
  end
end

class BaseballBat < Card
  def execute(g, ui)
    direction = ui.read_direction
    target_worm = g.nearest_worm(direction)
    if !target_worm.nil? && target_worm.point.distance(g.active_worm.point) == 1
      g.push_worm!(target_worm, direction)
      g.push_worm!(target_worm, direction)
      g.push_worm!(target_worm, direction)
    else
      warn "no target"
    end
  end
end

class Push < Card
  def execute(g, ui)
    direction = ui.read_direction
    target_worm = g.nearest_worm(direction)
    if !target_worm.nil? && target_worm.point.distance(g.active_worm.point) == 1
      g.push_worm!(target_worm, direction)
      g.push_worm!(target_worm, direction)
    else
      warn "no target"
    end
  end
end

class Hook < Card
  def execute(g, ui)
    direction = ui.read_direction
    target_worm = g.nearest_worm(direction)
    if !target_worm.nil?
      d = target_worm.point.distance(g.active_worm.point)
      (d-1).times {
        g.push_worm!(target_worm, [-direction[0], -direction[1]])
      }
    else
      warn "no target"
    end
  end
end

# TODO: Knife (need maybe_read_direction), Grenade/Airstrike (need ui.read_point), Dynamite/Mine, Missile (trous dans le plateau)



# flemme de chercher si de meilleurs asserts existent
def assert(fact, message = '')
  fail message unless fact
end
def assert_eq(expected, actual, message = '')
  unless expected == actual
    fail("Expected: '#{expected}', got '#{actual}'! #{message}")
  end
end
def assert_fails(message = '', &block)
  ok = false
  begin block.call rescue ok = true end
  fail('Code should have failed. ' + message) unless ok
end
def tests
  assert_eq('{4,6},{5,5},{5,6},{4,4},{3,5},{3,4}', Point.new(4, 5).neighbors.join(','), 'neighbors')
  assert_eq('{0,1},{1,0},{1,1}', Point.new(0, 0).neighbors.join(','), 'neighbors')
  assert_eq('{0,4},{1,3},{1,4},{0,2}', Point.new(0, 3).neighbors.join(','), 'neighbors')
  assert_fails('invalid point coordinates') { Point.new(4, GameParameters.size*2+3) }
  assert_fails('invalid point coordinates') { Point.new(-1, 0) }

  assert_eq(4, Point.new(4, 5).distance(Point.new(8, 7)), 'distance')
  assert_eq(3, Point.new(4, 5).distance(Point.new(4, 2)), 'distance')
  assert_eq(3, Point.new(4, 5).distance(Point.new(2, 2)), 'distance')
  100.times {
    p = Point.random_point
    for n in p.neighbors
      assert_eq(1, p.distance(n), 'distance')
    end
  }

  assert_eq('{4,5},{5,6},{6,7},{7,8}', Point.new(4, 5).line_to(Point.new(7, 8)).join(','), 'line')
  assert_eq('{4,5},{4,4},{4,3},{4,2}', Point.new(4, 5).line_to(Point.new(4, 2)).join(','), 'line')
  assert_eq('{4,5},{5,5},{6,5}', Point.new(4, 5).line_to(Point.new(6, 5)).join(','), 'line')
  assert_eq('{4,5}', Point.new(4, 5).line_to(Point.new(4, 5)).join(','), 'line')

  players = [Player.new('LLB'), Player.new('Sly')]
  fake_ui = nil
  g = GameState.new(players, fake_ui)
  # g.play_card!(Kamikaze.new)

  # TODO : des tests automatisés sur toutes les actions, à partir d'un board prédéfini.
end

tests
