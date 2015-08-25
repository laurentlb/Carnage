# -*- coding: utf-8 -*-
require './carnage'

class ConsoleUI
  def initialize(players)
    @game_state = GameState.new(players, self)
    puts "Instructions: every command is one character.
Directions are mapped to the 6 keys around F on qwerty/azerty.
Have fun!"
    puts @game_state.worms
      .select { |w| w.player_id >= 0 }
      .map { |w| "#{@game_state.players[w.player_id].name} plays #{w.name}" } if true
    puts('-'*22)
  end

  def display(moves_left)
    lines_left = Point.ascii_render(@game_state.worms) { |worm| @game_state.worm_to_char(worm) }
    lines_right = @game_state.visible_cards.each_with_index.map { |card,i| "#{i}: #{card.name}" }
    unless moves_left.nil?
      lines_right.concat [ "",
                           "Directions:",
                           " r t ",
                           "d . g",
                           " c v ",
                           "Remaining movements: #{moves_left}" ]
    end
    lines = []
    for i in 0..[lines_left, lines_right].map(&:size).max
      l, r = lines_left[i], lines_right[i]
      lines << "#{l.to_s.ljust(40)}#{r}"
    end
    puts lines.join("\n")
  end

  def main_loop
    loop do

      moves_left = GameParameters.moves_per_turn
      display(moves_left)
      loop do # loop over moves and card actions
        action = read_action
        if action.is_a? Card
          @game_state.play_card! action
          break
        else # move
          err = nil
          if moves_left > 0
            begin
              @game_state.move! action
              moves_left -= 1
            rescue InvalidActionException => c
              err = "*** #{c.message}"
            end
          else
            err = "*** No moves left!"
          end
          display(moves_left)
          puts err
        end
      end

      # end of turn: choose next player's worm
      display(nil)
      @game_state.active_worm = read_next_worm
      @game_state.turn += 1

    end
  end

  # in
  def read_action
    print "#{@game_state.active_player} (worm #{@game_state.worm_to_char(@game_state.active_worm)})> "
    str = readline.chomp
    card_index = Integer(str) rescue nil
    if card_index.nil?
      d = parse_direction(str)
      d.nil? ? read_action : d
    else
      card = @game_state.visible_cards[card_index]
      card.nil? ? read_action : card
    end
  end
  def read_direction
    print "Choose a direction> "
    str = readline.chomp
    d = parse_direction(str)
    d.nil? ? read_direction : d
  end
  def read_next_worm
    print "#{@game_state.active_player} select the next worm to play (for #{@game_state.next_player})> "
    str = readline.chomp
    worm = @game_state.worms.find { |w| w.name.upcase == str.upcase }
    return worm.nil? ? read_next_worm : worm
  end
  def parse_direction(str)
    case str
    when 'd' then [-1, 0]
    when 'g' then [+1, 0]
    when 'r' then [-1, -1]
    when 'v' then [+1, +1]
    when 'c' then [0, +1]
    when 't' then [0, -1]
    else nil
    end
  end

  # out
  def card_played(card)
    puts "*** Worm #{@game_state.active_worm.name} uses #{card.name}!"
  end
  def worm_injured(worm)
    puts "*** Worm #{worm.name} is injured!"
    puts "*** Worm #{worm.name} says: \"Stupid!\"" if worm == @game_state.active_worm
  end
  def worm_killed(worm)
    puts "*** Worm #{worm.name} is killed!"
  end
  def player_dies(player)
    puts "*** Player #{player.name} is dead!"
  end
  def game_end(player)
    if player.nil?
      puts "*** No player wins!"
    else
      puts "*** Player #{player.name} wins!"
    end
    exit
  end

end

ConsoleUI.new([Player.new('LLB'), Player.new('Sly')]).main_loop
