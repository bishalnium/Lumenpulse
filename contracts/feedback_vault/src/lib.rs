#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Feedback {
    pub id: u64,
    pub sender: Address,
    pub message: String,
    pub category: Symbol,
    pub timestamp: u64,
    pub tips: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VaultStats {
    pub total_feedbacks: u64,
    pub total_tips: i128,
}

#[contracttype]
pub enum DataKey {
    FeedbackCount,
    Feedback(u64),
    TotalTips,
}

#[contract]
pub struct FeedbackVaultContract;

#[contractimpl]
impl FeedbackVaultContract {
    /// Submit a new feedback or proposal to the vault
    pub fn send_feedback(env: Env, sender: Address, message: String, category: Symbol) -> u64 {
        sender.require_auth();

        let mut count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::FeedbackCount)
            .unwrap_or(0);

        count += 1;

        let timestamp = env.ledger().timestamp();
        let feedback = Feedback {
            id: count,
            sender: sender.clone(),
            message: message.clone(),
            category: category.clone(),
            timestamp,
            tips: 0,
        };

        // Store feedback persistently
        env.storage()
            .persistent()
            .set(&DataKey::Feedback(count), &feedback);
        
        // Update instance count
        env.storage()
            .instance()
            .set(&DataKey::FeedbackCount, &count);

        // Extend TTL
        env.storage().instance().extend_ttl(50000, 100000);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Feedback(count), 50000, 100000);

        // Emit on-chain event
        env.events().publish(
            (symbol_short!("fb_new"), category),
            (count, sender, message, timestamp),
        );

        count
    }

    /// Fetch a single feedback by its ID
    pub fn fetch_feedback(env: Env, id: u64) -> Feedback {
        env.storage()
            .persistent()
            .get(&DataKey::Feedback(id))
            .unwrap_or_else(|| panic!("Feedback ID not found in vault"))
    }

    /// Fetch total feedback count
    pub fn get_feedback_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::FeedbackCount)
            .unwrap_or(0)
    }

    /// Tip a feedback creator
    pub fn tip_feedback(env: Env, tipper: Address, feedback_id: u64, amount: i128) -> i128 {
        tipper.require_auth();
        if amount <= 0 {
            panic!("Tip amount must be positive");
        }

        let mut feedback: Feedback = env
            .storage()
            .persistent()
            .get(&DataKey::Feedback(feedback_id))
            .unwrap_or_else(|| panic!("Feedback ID not found"));

        feedback.tips += amount;

        let mut total_tips: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalTips)
            .unwrap_or(0);
        total_tips += amount;

        env.storage()
            .persistent()
            .set(&DataKey::Feedback(feedback_id), &feedback);
        env.storage().instance().set(&DataKey::TotalTips, &total_tips);

        // Emit tipping event
        env.events().publish(
            (symbol_short!("fb_tip"), feedback_id),
            (tipper, amount, feedback.tips),
        );

        feedback.tips
    }

    /// Fetch overall vault statistics
    pub fn get_vault_stats(env: Env) -> VaultStats {
        let total_feedbacks = Self::get_feedback_count(env.clone());
        let total_tips: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalTips)
            .unwrap_or(0);

        VaultStats {
            total_feedbacks,
            total_tips,
        }
    }

    /// Fetch recent feedbacks with a pagination limit
    pub fn fetch_recent(env: Env, limit: u32) -> Vec<Feedback> {
        let total = Self::get_feedback_count(env.clone());
        let mut results = Vec::new(&env);

        if total == 0 {
            return results;
        }

        let count_to_fetch = if (limit as u64) < total {
            limit as u64
        } else {
            total
        };

        let start_id = total - count_to_fetch + 1;

        for id in (start_id..=total).rev() {
            if let Some(fb) = env
                .storage()
                .persistent()
                .get::<DataKey, Feedback>(&DataKey::Feedback(id))
            {
                results.push_back(fb);
            }
        }

        results
    }
}

#[cfg(test)]
mod test;
