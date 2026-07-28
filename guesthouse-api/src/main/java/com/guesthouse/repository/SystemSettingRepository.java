package com.guesthouse.repository;

import com.guesthouse.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SystemSettingRepository extends JpaRepository<SystemSetting, UUID> {
    List<SystemSetting> findByPropertyId(UUID propertyId);
    List<SystemSetting> findByPropertyIdAndCategory(UUID propertyId, String category);
    Optional<SystemSetting> findByPropertyIdAndSettingKey(UUID propertyId, String settingKey);
}
