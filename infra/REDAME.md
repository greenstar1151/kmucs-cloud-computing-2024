# IaC with Terraform

## Prerequisites

### Terraform
- [Terraform](https://developer.hashicorp.com/terraform/install)

### AWS CLI
- [AWS CLI](https://docs.aws.amazon.com/ko_kr/cli/latest/userguide/getting-started-install.html)
- `~/.aws/config`
    ```
    [default]
    region = us-west-2
    aws_access_key_id = <access_key>
    aws_secret_access_key = <secret_key>
    aws_session_token = <session_token>
    ```

    AWS Learner Lab의 경우 랩 실행 후 AWS Details > AWS CLI 에 표시된 내용을 복사하여 사용합니다.
    랩 실행마다 위 값들이 변경되니, 매번 값을 업데이트 해주어야 합니다.

## Terraform Backend

- 참고 - 테라폼 벡엔드란? [Terraform Backend](https://developer.hashicorp.com/terraform/language/backend#overview)
- `infra/backend.tf` 에서 설정 후 terraform init 을 실행합니다.

### S3 Bucket
- `infra/backend.tf`
    ```hcl
    terraform {
      backend "s3" {
        bucket = "terraform-state-<your-name>"
        key    = "terraform.tfstate"
        region = "us-west-2"
      }
    }
    ```
    - NOTE: S3 버킷이 해당 리전에 먼저 생성되어 있어야 합니다.

### Local
- `infra/backend.tf`
    ```hcl
    terraform {
      backend "local" {
        path = "terraform.tfstate"
      }
    }
    ```

## Deploy

```bash
cd infra
```

```bash
terraform init
terraform apply
```

