export const QVotingCode = `
scilla_version 0 

import BoolUtils IntUtils ListUtils PairUtils


library QVote 

let zero = Uint32 0 

let register_address_list: List ByStr20 -> List Int32 -> Map ByStr20 Int32 = 
	fun(addresses: List ByStr20) => 
	fun(balances: List Int32) =>
		let init = Emp ByStr20 Int32 in 
		let zip = @list_zip ByStr20 Int32 in
    let zipped = zip addresses balances in
    let foldleft = @list_foldl (Pair ByStr20 Int32) (Map ByStr20 Int32) in
    let f = @fst ByStr20 Int32 in 
    let s = @snd ByStr20 Int32 in 
    let insert = 
      fun(acc : Map ByStr20 Int32) => 
      fun(address_credits_p : Pair ByStr20 Int32) => 
        let address = f address_credits_p in 
        let balance = s address_credits_p in 
        builtin put acc address balance
		in foldleft insert init zipped
	 

let vote_from_list_of_options_credits_to_map: List String -> List Int128 -> Map String Int128 -> Map String Int128 =
  fun(ls: List String) =>
    fun(lc: List Int128) => 
      fun(msi: Map String Int128) => 
        let zip = @list_zip String Int128 in
        let zipped = zip ls lc in
        let foldleft = @list_foldl (Pair String Int128) (Map String Int128) in
        let f = @fst String Int128 in
        let s = @snd String Int128 in
        let addVote =
         fun (acc : Map String Int128) =>
         fun (option_credit_pair : Pair String Int128) =>
          let opt = f option_credit_pair in
          let cred = s option_credit_pair in
          let cur_val = builtin get acc opt in
          match cur_val with
          | Some cur =>
            let new_val = builtin add cur cred in
            builtin put acc opt new_val
          | None =>
            builtin put acc opt cred
          end
         in
        foldleft addVote msi zipped
        
let pos_int128_sqrt: Int128 -> Int128 =
  fun(i: Int128) =>
    let uint = builtin to_uint128 i in
    match uint with
      | Some c =>
        let sqrt = builtin isqrt c in
        let int = builtin to_int128 sqrt in
        match int with 
        | Some cast_int =>
          cast_int
        | None =>
          Int128 0
        end
      | None =>
        Int128 0
    end


(* 
  @notice: THE RESULT NEEDS TO BE DIV BY 100 
  This is actually not exactly a sqrt function
  given an integer i
  it returns sign(i)*sqrt(abs(i))*100
*)
let int128_credit_to_vote: Int128 -> Int128 =
   fun(i : Int128) =>
    let zero = Int128 0 in
    let is_negative = int128_lt i zero in
    let ten_k = Int128 10000 in
    let mult_by_10k = builtin mul ten_k i in
    match is_negative with 
    | True => 
      let minus_one = Int128 -1 in
      let positive = builtin mul minus_one mult_by_10k in
      let res = pos_int128_sqrt positive in
      builtin mul minus_one res
    | False  =>
      pos_int128_sqrt mult_by_10k
    end
    
    
let int32_to_int128: Int32 -> Int128 =
  fun(i : Int32) =>
    let res = builtin to_int128 i in
    match res with
      | Some c => c
      | None => Int128 0
    end


let int128_map_credits_to_votes: List Int128 -> List Int128 =
  fun(l : List Int128) =>
    let map = @list_map Int128 Int128 in
    map int128_credit_to_vote l



let int128_abs: Int128 -> Int128 = 
  fun(i : Int128) =>
    let zero = Int128 0 in
    let is_negative = int128_lt i zero in
    match is_negative with 
    | True => 
      let minus_one = Int128 -1 in
      builtin mul minus_one i
    | False  => i
    end


let in128_list_abs: List Int128 -> List Int128 = 
  fun(l : List Int128) => 
    let map = @list_map Int128 Int128 in
    map int128_abs l
    

let i128_len: List Int128 -> Uint32 = 
  fun (l : List Int128) => 
    let len = @list_length Int128 in
    len l

let s_len: List String -> Uint32 = 
  fun (l : List String) => 
    let len = @list_length String in
    len l


let eq_string: String -> String -> Bool = 
  fun(s1 : String) => 
  fun(s2 : String) =>
    builtin eq s1 s1

let eq_lr_pair: Pair String String -> Bool =
  fun(p : Pair String String) =>
    let f = @fst String String in
    let s = @snd String String in
    let l = f p in
    let r = s p in
    eq_string l r
    
let eq_string_lists: List String -> List String -> Bool = 
  fun(ls1 : List String) => 
  fun(ls2 : List String) =>
    let zip = @list_zip String String in
    let zipped = zip ls1 ls2 in
    let all = @list_forall (Pair String String) in
    all eq_lr_pair zipped
    
let int128_list_int128_sum : List Int128 -> Int128 =
   fun (l : List Int128) =>
   let foldleft = @list_foldl Int128 Int128 in
   let initState = Int128 0 in
   let addVal =
     fun (acc : Int128) =>
     fun (credits : Int128) =>
       builtin add acc credits
   in
     foldleft addVal initState l

let list_exist_string = @list_exists String 
let list_length_string = @list_length String  

let append_voter = 
	fun(voter_list : List ByStr20) => 
	fun(new_voter : ByStr20) => 
		Cons {ByStr20} new_voter voter_list

let check_option_list_valid = 
	fun (option_list : List String) => 
		let l = list_length_string option_list in 
			builtin eq l zero

let check_valid_times = 
  fun(current: BNum) => 
  fun(registration: BNum) => 
  fun(decision: BNum) =>
    let registration_over = builtin blt registration current in 
    let decision_not_over = builtin blt current decision in 
      andb registration_over decision_not_over


(* event codes *) 
let not_owner_code = Uint32 0

(* decision build codes *) 
let decision_already_built_code = Uint32 1
let decision_not_build_code = Uint32 2
let option_titles_invalid_code = Uint32 3
let times_invalid_code = Uint32 4
let build_decision_success_code = Uint32 5 

(* registration codes *) 
let election_started_code = Uint32 6
let zero_token_balance_code = Uint32 7
let already_registered_code = Uint32 8
let register_success_code = Uint32 9 

let owner_register_success_code = Uint32 15
let ownwer_register_failure_code = Uint32 16 

(* vote codes *)
let option_invalid_code = Uint32 10 
let not_registered_code = Uint32 11 
let insufficient_balance_code = Uint32 12 
let not_in_time = Uint32 13
let vote_success_code = Uint32 14

(* events *)
let build_decision_success_event = {_eventname: "build_decision_success"; code: build_decision_success_code}
let build_decision_failure_event =
  fun(event_code: Uint32) => 
    {_eventname: "build_decision_failure"; code: event_code}
    
let register_success_event = {_eventname: "register_success"; code: register_success_code}
let register_failure_event = 
  fun(event_code: Uint32) => 
    {_eventname: "register_failure"; code: event_code}

let vote_success_event = {_eventname: "vote_success"; code: vote_success_code}
let vote_failure_event = 
  fun(event_code: Uint32) => 
    {_eventname: "vote_failure"; code: event_code}
    
let owner_register_event_success = {_eventname: "owner_register_success"; code: owner_register_success_code}
let owner_register_event_failure = 
  fun(event_code: Uint32) => 
    {_eventname: "owner_register_failure"; code: event_code}

contract QVote 
(
    owner: ByStr20,
    expiration_block: BNum, (* last block at which votes are accepted *)
    name: String,           (* decision name *) 
    description: String,
    options: List String,   (* votes can be casted for each of these options *) 
    credit_to_token_ratio: Int32,     (* how many credits get issued for each token in the voters balance *)
    registration_end_time: BNum,      (* block after which users can't sign up for the election anymore *) 
	token_id: String    (* token id used to calculate credit balance of users, currently only one is supported, could be extended to multiple *)
)

(* chacking parameters *)
with
  let zero = Uint32 0 in
  let correct_times = builtin blt registration_end_time expiration_block in 
  let len_func = @list_length String in 
  let option_len = len_func options in 
  let valid_option = builtin lt zero option_len in 
  andb correct_times valid_option
=>

field voter_balances : Map ByStr20 Int32 = Emp ByStr20 Int32
(* VOTES have to be div by 100 to get the actual votes since sqrt is an integer sqrt *)
field options_to_votes_map : Map String Int128 = Emp String Int128

(* CENTRALIZED 
this contains the list of users that have registered. right before the election time the oracle will
assign credits to this *)
field registered_voters : List ByStr20 = Nil {ByStr20}

(* CENTRALIZED
this transition is only used at the moment, until we either find a decentralized oracle,
or we can access another contract's state directly *)

transition owner_register(addresses : List ByStr20, credits : List Int32)
	is_owner = builtin eq _sender owner; 
	match is_owner with
	| False => 
		e = owner_register_event_failure not_owner_code; 
		event e
	| True => 
		voter_balances_ = register_address_list addresses credits; 
		voter_balances := voter_balances_; 
		e = owner_register_event_success; 
		event e
	end
end 

transition register()
	(* TODO implement all the various checks *)
	registered_voters_old <- registered_voters; 
	new_voter_list = append_voter registered_voters_old _sender; 
	registered_voters := new_voter_list; 
	e = register_success_event;
	event e
end 


(* 
    @notice: vote on the decision
    @param: credtis: Credits corresponding by index to option names
*)
(* TODO do some maths that calculates the max number of credits that can be submitted
   aka at what point List Int128 > Int256
*)
transition vote(credits_sender: List Int128)	
  blk <- & BLOCKNUMBER;
  in_time = check_valid_times blk registration_end_time expiration_block; 
  match in_time with 
  | False => 
    e = vote_failure_event not_in_time; 
    event e
  | True => 
  	(* check if options.length == credits_sender.length *)
  	cs_len = i128_len credits_sender;
  	opt_len = s_len options;
  	eq_len = uint32_eq opt_len cs_len;
  	(* for all credits_sender take absolute val *)
  	abs_val_sender_credits = in128_list_abs credits_sender;
  	(* get sum of abs val *)
  	abs_val_sum_int128 = int128_list_int128_sum abs_val_sender_credits;
  	(* get voter balance *)
  	voter_balance <- voter_balances[_sender];
  	match voter_balance with
  	 | Some voter_b =>
  	   (* voter balance to int128 *)
      	voter_balance_int128 = int32_to_int128 voter_b;
      	(* check if credits_sum <= balance *)
        bal_valid = int128_le abs_val_sum_int128 voter_balance_int128;
      	temp = andb bal_valid eq_len;
      	is_valid = temp;
      	match is_valid with
      	 | False =>
      	  e = vote_failure_event option_invalid_code;
      		event e
      	 | True => 
      	 (* do votin stuff *)
      	  copy <- options_to_votes_map;
      	  votes_sender = int128_map_credits_to_votes credits_sender;
      	  new_opt_votes_map = vote_from_list_of_options_credits_to_map options votes_sender copy;
      	  options_to_votes_map := new_opt_votes_map;
      	  (* can vote only once *)
      	  zero = Int32 0;
      	  voter_balances[_sender] := zero;
      	  e = vote_success_event; 
      		event e
      	 end
  	 | None =>
       e = vote_failure_event not_registered_code;
  	   event e
  	end
  end
end 
	

`;
export const DecisionQueueCode = `
scilla_version 0 

import BoolUtils IntUtils ListUtils PairUtils


library DecisionQueue 

let bystr20_len: List ByStr20 -> Uint32 = 
  fun (l : List ByStr20) => 
    let len = @list_length ByStr20 in
    len l
    
let bystr20_tail: List ByStr20 -> List ByStr20 = 
  fun (l : List ByStr20) => 
    let tail = @list_tail ByStr20 in
    let list_tail = tail l in
    match list_tail with 
      | Some res => res
      | None => Nil {ByStr20}
    end
    
let bystr20_eq: ByStr20 -> ByStr20 -> Bool =
  fun(e1 : ByStr20) =>
  fun(e2 : ByStr20) => 
    builtin eq e1 e2
    
let bystr20_has_elem: List ByStr20 -> ByStr20 -> Bool = 
  fun (l : List ByStr20) => 
  fun (e : ByStr20) =>
    let curried = bystr20_eq e in
    let has = @list_exists ByStr20 in
    has curried l 

let delete_first_if_max_reached: List ByStr20 -> Uint32 -> List ByStr20 =
  fun (l : List ByStr20) => 
  fun (max_size : Uint32) => 
    let cur_size = bystr20_len l in
    let is_too_big = uint32_le max_size cur_size in
    match is_too_big with
      | True => bystr20_tail l
      | False => l
    end
    
let bystr20_append_back: List ByStr20 -> ByStr20 -> List ByStr20 =
  fun (l : List ByStr20) => 
  fun (to_append : ByStr20) => 
    let rev = @list_reverse ByStr20 in
    let reversed_l = rev l in
    let appended = Cons {ByStr20} to_append reversed_l in
    rev appended

let already_in_queue_event_code = Uint32 0
let not_owner_code = Uint32 1 

let push_success_event = {_eventname: "push_success"}
let push_failure_event = fun(event_code : Uint32) => 
	{_eventname: "push_failured"; code: event_code}


contract DecisionQueue 
(
    owner: ByStr20,
    is_decision_queue: Bool,
    max_queue_size: Uint32
)

field queue : List (ByStr20) = Nil {ByStr20}

(*
  @notice: this queue accepts any address and deletes the oldest 
  address upon reaching the max size
  @param: addr : address of the smart contract to add to the queue
*)
transition pushToQueue(addr: ByStr20)
	is_owner = builtin eq _sender owner;
	match is_owner with 
	| False => 
		e = push_failure_event not_owner_code; 
		event e 
	| True => 
		cur_queue <- queue;
		(* check if addr not already in queue *)
		has_addr = bystr20_has_elem cur_queue addr;
		match has_addr with
		| True => 
			e = push_failure_event already_in_queue_event_code; 
			event e
		| False =>
			(* check if the queue reached max size *)
			(* if reached max size delete oldest address *)
			(* else just return the list  *)
			del_queue = delete_first_if_max_reached cur_queue max_queue_size;
			new_queue = bystr20_append_back del_queue addr;
			queue := new_queue;
			(* push the new address to queue *)
			e = push_success_event;
			event e 
		end
	end 
end

`;
