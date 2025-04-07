import hashlib
import json
import time
from typing import List, Dict

class Block:
    def __init__(self, index: int, transactions: List[Dict], timestamp: float, previous_hash: str):
        self.index = index
        self.transactions = transactions
        self.timestamp = timestamp
        self.previous_hash = previous_hash
        self.nonce = 0
        self.hash = self.calculate_hash()

    def calculate_hash(self) -> str:
        block_string = json.dumps({
            "index": self.index,
            "transactions": self.transactions,
            "timestamp": self.timestamp,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()

    def mine_block(self, difficulty: int):
        while self.hash[:difficulty] != "0" * difficulty:
            self.nonce += 1
            self.hash = self.calculate_hash()

class Blockchain:
    def __init__(self, difficulty: int = 4):
        self.chain: List[Block] = []
        self.pending_transactions: List[Dict] = []
        self.difficulty = difficulty
        self.mining_reward = 1.0
        self.create_genesis_block()

    def create_genesis_block(self):
        genesis_block = Block(0, [], time.time(), "0")
        genesis_block.mine_block(self.difficulty)
        self.chain.append(genesis_block)

    def get_latest_block(self) -> Block:
        return self.chain[-1]

    def add_transaction(self, transaction: Dict) -> bool:
        if not all(key in transaction for key in ["symbol", "type", "quantity", "price", "trader"]):
            return False
        
        self.pending_transactions.append({
            **transaction,
            "timestamp": time.time()
        })
        return True

    def mine_pending_transactions(self, miner_address: str) -> Block:
        if not self.pending_transactions:
            return None

        block = Block(
            len(self.chain),
            self.pending_transactions,
            time.time(),
            self.get_latest_block().hash
        )

        block.mine_block(self.difficulty)
        self.chain.append(block)

        # Clear pending transactions and reward the miner
        self.pending_transactions = [{
            "symbol": "REWARD",
            "type": "reward",
            "quantity": 1,
            "price": self.mining_reward,
            "trader": miner_address,
            "timestamp": time.time()
        }]

        return block

    def is_chain_valid(self) -> bool:
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]

            # Verify current block's hash
            if current_block.hash != current_block.calculate_hash():
                return False

            # Verify chain linkage
            if current_block.previous_hash != previous_block.hash:
                return False

        return True

    def get_trader_transactions(self, trader_address: str) -> List[Dict]:
        transactions = []
        for block in self.chain:
            for tx in block.transactions:
                if tx.get("trader") == trader_address:
                    transactions.append({
                        **tx,
                        "block_index": block.index,
                        "block_hash": block.hash
                    })
        return transactions

    def get_all_transactions(self) -> List[Dict]:
        transactions = []
        for block in self.chain:
            for tx in block.transactions:
                transactions.append({
                    **tx,
                    "block_index": block.index,
                    "block_hash": block.hash
                })
        return transactions

    def to_dict(self) -> Dict:
        return {
            "chain": [{
                "index": block.index,
                "transactions": block.transactions,
                "timestamp": block.timestamp,
                "previous_hash": block.previous_hash,
                "nonce": block.nonce,
                "hash": block.hash
            } for block in self.chain],
            "pending_transactions": self.pending_transactions,
            "difficulty": self.difficulty,
            "mining_reward": self.mining_reward
        }
