// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract ArcLoyalty {
    struct Entry { address from; address to; string memo; uint256 amount; bool settled; uint256 at; }
    Entry[] public entries;
    mapping(address => uint256[]) private fromMap;
    mapping(address => uint256[]) private toMap;
    event Added(uint256 indexed id, address indexed from, address indexed to, uint256 amount);
    event Settled(uint256 indexed id);
    function add(address to, string calldata memo, uint256 amount) external returns (uint256 id) {
        require(to != address(0), "bad");
        id = entries.length; entries.push(Entry(msg.sender, to, memo, amount, false, block.timestamp));
        fromMap[msg.sender].push(id); toMap[to].push(id);
        emit Added(id, msg.sender, to, amount);
    }
    function settle(uint256 id) external payable {
        Entry storage e = entries[id]; require(!e.settled, "done"); require(msg.value == e.amount && e.amount > 0, "amount");
        e.settled = true; (bool ok,) = payable(e.to).call{value: msg.value}(""); require(ok, "fail"); emit Settled(id);
    }
    function get(uint256 id) external view returns (Entry memory) { return entries[id]; }
    function getFrom(address u) external view returns (uint256[] memory) { return fromMap[u]; }
    function getTo(address u) external view returns (uint256[] memory) { return toMap[u]; }
    function total() external view returns (uint256) { return entries.length; }
}
