#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, symbol_short, Address, Env, String};

#[test]
fn test_send_and_fetch_feedback() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(FeedbackVaultContract, ());
    let client = FeedbackVaultContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    let message = String::from_str(&env, "Loving the fast finality on Stellar!");
    let category = symbol_short!("feature");

    let feedback_id = client.send_feedback(&user, &message, &category);
    assert_eq!(feedback_id, 1);

    let feedback = client.fetch_feedback(&feedback_id);
    assert_eq!(feedback.id, 1);
    assert_eq!(feedback.sender, user);
    assert_eq!(feedback.message, message);
    assert_eq!(feedback.category, category);
    assert_eq!(feedback.tips, 0);
}

#[test]
fn test_multiple_feedbacks_and_recent_query() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(FeedbackVaultContract, ());
    let client = FeedbackVaultContractClient::new(&env, &contract_id);

    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    let id1 = client.send_feedback(
        &user1,
        &String::from_str(&env, "First feedback"),
        &symbol_short!("ui"),
    );
    let id2 = client.send_feedback(
        &user2,
        &String::from_str(&env, "Second feedback"),
        &symbol_short!("dao"),
    );

    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
    assert_eq!(client.get_feedback_count(), 2);

    let recent = client.fetch_recent(&5);
    assert_eq!(recent.len(), 2);
    assert_eq!(recent.get(0).unwrap().id, 2);
    assert_eq!(recent.get(1).unwrap().id, 1);
}

#[test]
fn test_tipping_and_vault_stats() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(FeedbackVaultContract, ());
    let client = FeedbackVaultContractClient::new(&env, &contract_id);

    let author = Address::generate(&env);
    let tipper = Address::generate(&env);

    let id = client.send_feedback(
        &author,
        &String::from_str(&env, "Stellar Soroban is amazing!"),
        &symbol_short!("general"),
    );

    let updated_tips = client.tip_feedback(&tipper, &id, &500_0000000); // 500 XLM equivalent
    assert_eq!(updated_tips, 500_0000000);

    let feedback = client.fetch_feedback(&id);
    assert_eq!(feedback.tips, 500_0000000);

    let stats = client.get_vault_stats();
    assert_eq!(stats.total_feedbacks, 1);
    assert_eq!(stats.total_tips, 500_0000000);
}

#[test]
#[should_panic(expected = "Feedback ID not found")]
fn test_nonexistent_feedback_panic() {
    let env = Env::default();
    let contract_id = env.register(FeedbackVaultContract, ());
    let client = FeedbackVaultContractClient::new(&env, &contract_id);

    // Query ID 999 which does not exist
    client.fetch_feedback(&999);
}
